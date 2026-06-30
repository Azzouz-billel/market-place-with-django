from decimal import ROUND_HALF_UP, Decimal

from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = "percent", "Percentage"
        FIXED = "fixed", "Fixed amount"

    code = models.CharField(max_length=40, unique=True)
    discount_type = models.CharField(max_length=10, choices=DiscountType.choices)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_to = models.DateTimeField(null=True, blank=True)
    min_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    def __str__(self):
        return self.code

    def save(self, *args, **kwargs):
        self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def is_valid(self, subtotal, *, at=None):
        at = at or timezone.now()
        if not self.active:
            return False
        if self.valid_from and at < self.valid_from:
            return False
        if self.valid_to and at > self.valid_to:
            return False
        return subtotal >= self.min_subtotal

    def discount_for(self, subtotal: Decimal) -> Decimal:
        """Discount amount for a subtotal, never exceeding it."""
        if self.discount_type == self.DiscountType.PERCENT:
            raw = subtotal * self.value / Decimal("100")
        else:
            raw = self.value
        capped = min(raw, subtotal)
        return capped.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
