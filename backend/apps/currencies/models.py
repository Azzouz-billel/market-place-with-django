from decimal import Decimal

from django.db import models


class Currency(models.Model):
    """A display currency with a manual exchange rate relative to the base (USD).

    Prices are stored in USD; the storefront multiplies by `rate` for display.
    """

    code = models.CharField(max_length=3, unique=True)  # ISO 4217, e.g. USD, EUR
    name = models.CharField(max_length=60)
    symbol = models.CharField(max_length=8)
    rate = models.DecimalField(
        max_digits=12, decimal_places=6, default=Decimal("1.000000"),
        help_text="Units of this currency per 1 USD.",
    )
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["code"]
        verbose_name_plural = "currencies"

    def __str__(self):
        return self.code

    def save(self, *args, **kwargs):
        self.code = self.code.upper().strip()
        super().save(*args, **kwargs)
