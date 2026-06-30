from decimal import Decimal

from rest_framework.test import APITestCase

from apps.catalog.models import Category, Product, ProductVariant


class CartApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Apparel", slug="apparel")
        self.product = Product.objects.create(
            name="Tee", slug="tee", category=category, base_price=Decimal("10.00")
        )
        self.variant = ProductVariant.objects.create(
            product=self.product, name="Medium", sku="TEE-M", stock_quantity=5
        )

    def _add(self, quantity=1, token=None, variant_id=None):
        headers = {"X-Cart-Token": token} if token else {}
        return self.client.post(
            "/api/cart/items/",
            {"variant_id": variant_id or self.variant.id, "quantity": quantity},
            format="json",
            headers=headers,
        )

    def test_adding_item_creates_cart_with_token(self):
        response = self._add(quantity=1)
        self.assertIsNotNone(response.data["token"])

    def test_adding_same_variant_twice_increments_quantity(self):
        token = self._add(quantity=1).data["token"]
        response = self._add(quantity=2, token=token)
        self.assertEqual(response.data["total_quantity"], 3)

    def test_subtotal_reflects_quantity_times_price(self):
        response = self._add(quantity=2)
        self.assertEqual(response.data["subtotal"], "20.00")

    def test_quantity_is_clamped_to_available_stock(self):
        response = self._add(quantity=999)
        self.assertEqual(response.data["total_quantity"], 5)

    def test_adding_out_of_stock_variant_is_rejected(self):
        self.variant.stock_quantity = 0
        self.variant.save()
        response = self._add(quantity=1)
        self.assertEqual(response.status_code, 400)

    def test_updating_quantity_changes_total(self):
        add = self._add(quantity=1)
        item_id = add.data["items"][0]["id"]
        response = self.client.patch(
            f"/api/cart/items/{item_id}/",
            {"quantity": 4},
            format="json",
            headers={"X-Cart-Token": add.data["token"]},
        )
        self.assertEqual(response.data["total_quantity"], 4)

    def test_removing_item_empties_cart(self):
        add = self._add(quantity=1)
        item_id = add.data["items"][0]["id"]
        response = self.client.delete(
            f"/api/cart/items/{item_id}/",
            headers={"X-Cart-Token": add.data["token"]},
        )
        self.assertEqual(response.data["total_quantity"], 0)

    def test_cannot_modify_item_belonging_to_another_cart(self):
        cart_a = self._add(quantity=1)
        item_id = cart_a.data["items"][0]["id"]
        cart_b_token = self._add(quantity=1).data["token"]
        response = self.client.patch(
            f"/api/cart/items/{item_id}/",
            {"quantity": 2},
            format="json",
            headers={"X-Cart-Token": cart_b_token},
        )
        self.assertEqual(response.status_code, 404)

    def test_unknown_token_returns_empty_cart(self):
        response = self.client.get(
            "/api/cart/",
            headers={"X-Cart-Token": "00000000-0000-0000-0000-000000000000"},
        )
        self.assertEqual(response.data["total_quantity"], 0)
