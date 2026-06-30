from decimal import Decimal

from django.db import transaction

from .models import Order, OrderItem

SHIPPING_FIELDS = (
    "shipping_name",
    "shipping_line1",
    "shipping_line2",
    "shipping_city",
    "shipping_state",
    "shipping_postal_code",
    "shipping_country",
    "phone",
)


class CheckoutError(Exception):
    """Raised when an order cannot be created from the cart."""


@transaction.atomic
def create_order_from_cart(cart, *, email, shipping, user=None):
    """Create a pending Order snapshotting current cart contents and prices.

    Stock is validated here but only decremented once payment is confirmed.
    """
    items = list(cart.items.select_related("variant__product"))
    if not items:
        raise CheckoutError("Your cart is empty.")

    order = Order.objects.create(
        user=user,
        email=email,
        cart_token=str(cart.token),
        **{field: shipping.get(field, "") for field in SHIPPING_FIELDS},
    )

    total = Decimal("0.00")
    for item in items:
        variant = item.variant
        if variant.stock_quantity < item.quantity:
            raise CheckoutError(
                f"Not enough stock for {variant.product.name} ({variant.name})."
            )
        unit_price = variant.effective_price
        OrderItem.objects.create(
            order=order,
            variant=variant,
            product_name=variant.product.name,
            variant_name=variant.name,
            sku=variant.sku,
            unit_price=unit_price,
            quantity=item.quantity,
        )
        total += unit_price * item.quantity

    order.subtotal = total
    coupon = cart.coupon
    if coupon is not None and coupon.is_valid(total):
        order.discount = coupon.discount_for(total)
        order.coupon_code = coupon.code
    order.total = order.subtotal - order.discount
    order.save(update_fields=["subtotal", "discount", "coupon_code", "total"])
    return order
