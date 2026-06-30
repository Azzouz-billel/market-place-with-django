import stripe
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.cart.models import Cart

from .emails import send_order_confirmation
from .models import Order


def _configure_stripe():
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def create_checkout_session(order, *, success_url, cancel_url):
    """Return a URL to send the customer to for payment.

    With Stripe configured, this is a hosted Checkout Session. Without it (the
    dev bypass), it's the success URL directly — the order is confirmed on return.
    """
    if not settings.STRIPE_ENABLED:
        return success_url

    client = _configure_stripe()
    session_kwargs = {
        "mode": "payment",
        "customer_email": order.email,
        "line_items": [
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": f"{item.product_name} — {item.variant_name}"},
                    "unit_amount": int(item.unit_price * 100),
                },
                "quantity": item.quantity,
            }
            for item in order.items.all()
        ],
        "success_url": success_url,
        "cancel_url": cancel_url,
        "metadata": {"order_reference": str(order.reference)},
    }
    if order.discount > 0:
        # A one-off coupon so Stripe's hosted total matches our discounted total.
        coupon = client.Coupon.create(
            amount_off=int(order.discount * 100), currency="usd", duration="once"
        )
        session_kwargs["discounts"] = [{"coupon": coupon.id}]
    session = client.checkout.Session.create(**session_kwargs)
    order.stripe_session_id = session.id
    order.save(update_fields=["stripe_session_id"])
    return session.url


def mark_order_paid(order, *, payment_intent=""):
    """Idempotently mark an order paid: set status, decrement stock, email, clear cart."""
    if order.is_paid:
        return order

    with transaction.atomic():
        order.status = Order.Status.PAID
        order.paid_at = timezone.now()
        if payment_intent:
            order.stripe_payment_intent = payment_intent
        order.save()

        for item in order.items.select_related("variant"):
            if item.variant is not None:
                item.variant.stock_quantity = max(0, item.variant.stock_quantity - item.quantity)
                item.variant.save(update_fields=["stock_quantity"])

        if order.cart_token:
            Cart.objects.filter(token=order.cart_token).delete()

    send_order_confirmation(order)
    return order


def confirm_order(order):
    """Verify-on-return: with Stripe, check the session paid; in dev, mark paid."""
    if order.is_paid:
        return order
    if not settings.STRIPE_ENABLED:
        return mark_order_paid(order)

    client = _configure_stripe()
    session = client.checkout.Session.retrieve(order.stripe_session_id)
    if session.payment_status == "paid":
        return mark_order_paid(order, payment_intent=session.get("payment_intent") or "")
    return order
