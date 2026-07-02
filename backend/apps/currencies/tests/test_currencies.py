from decimal import Decimal

from rest_framework.test import APITestCase

from apps.currencies.models import Currency


class CurrencyTests(APITestCase):
    def test_code_is_stored_uppercase(self):
        currency = Currency.objects.create(code="eur", name="Euro", symbol="€", rate=Decimal("0.92"))
        self.assertEqual(currency.code, "EUR")

    def test_endpoint_lists_currencies(self):
        Currency.objects.create(code="USD", name="US Dollar", symbol="$", rate=Decimal("1"), is_default=True)
        Currency.objects.create(code="EUR", name="Euro", symbol="€", rate=Decimal("0.92"))
        response = self.client.get("/api/currencies/")
        self.assertEqual({c["code"] for c in response.data}, {"USD", "EUR"})
