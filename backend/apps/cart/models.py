import uuid
from decimal import Decimal

from django.db import models

from apps.catalog.models import ProductVariant
from apps.discounts.models import Coupon


class Cart(models.Model):
    """A guest shopping cart, identified by an opaque token.

    The token is held by the frontend in an httpOnly cookie and sent back as
    the X-Cart-Token header.
    """

    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    coupon = models.ForeignKey(
        Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart {self.token}"

    @property
    def subtotal(self) -> Decimal:
        return sum((item.line_total for item in self.items.all()), Decimal("0.00"))

    @property
    def discount(self) -> Decimal:
        """Discount from the applied coupon, recomputed against the current subtotal.

        Returns 0 if no coupon or the coupon is no longer valid for this cart.
        """
        if self.coupon is None:
            return Decimal("0.00")
        subtotal = self.subtotal
        if not self.coupon.is_valid(subtotal):
            return Decimal("0.00")
        return self.coupon.discount_for(subtotal)

    @property
    def total(self) -> Decimal:
        return self.subtotal - self.discount

    @property
    def total_quantity(self) -> int:
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        # One row per variant in a cart; adding again increments quantity.
        constraints = [
            models.UniqueConstraint(fields=["cart", "variant"], name="unique_cart_variant")
        ]
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity} × {self.variant}"

    @property
    def line_total(self) -> Decimal:
        return self.variant.effective_price * self.quantity
