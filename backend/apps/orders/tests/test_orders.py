from decimal import Decimal
from unittest.mock import patch

from django.core import mail
from rest_framework.test import APITestCase

from apps.cart.models import Cart, CartItem
from apps.catalog.models import Category, Product, ProductVariant
from apps.orders.models import Order
from apps.orders.payments import mark_order_paid
from apps.orders.services import CheckoutError, create_order_from_cart

SHIPPING = {
    "shipping_name": "Ada Lovelace",
    "shipping_line1": "1 Analytical Way",
    "shipping_line2": "",
    "shipping_city": "London",
    "shipping_state": "",
    "shipping_postal_code": "EC1A 1AA",
    "shipping_country": "GB",
    "phone": "",
}


class OrderServiceTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Apparel", slug="apparel")
        self.product = Product.objects.create(
            name="Tee", slug="tee", category=category, base_price=Decimal("10.00")
        )
        self.variant = ProductVariant.objects.create(
            product=self.product, name="Medium", sku="TEE-M", stock_quantity=5
        )

    def _cart(self, quantity=2):
        cart = Cart.objects.create()
        CartItem.objects.create(cart=cart, variant=self.variant, quantity=quantity)
        return cart

    def test_order_total_is_quantity_times_price(self):
        order = create_order_from_cart(self._cart(quantity=2), email="a@b.com", shipping=SHIPPING)
        self.assertEqual(order.total, Decimal("20.00"))

    def test_order_item_snapshots_product_name(self):
        order = create_order_from_cart(self._cart(), email="a@b.com", shipping=SHIPPING)
        self.assertEqual(order.items.first().product_name, "Tee")

    def test_empty_cart_is_rejected(self):
        with self.assertRaises(CheckoutError):
            create_order_from_cart(Cart.objects.create(), email="a@b.com", shipping=SHIPPING)

    def test_mark_order_paid_sets_status(self):
        order = create_order_from_cart(self._cart(), email="a@b.com", shipping=SHIPPING)
        mark_order_paid(order)
        self.assertEqual(order.status, Order.Status.PAID)

    def test_mark_order_paid_decrements_stock(self):
        order = create_order_from_cart(self._cart(quantity=2), email="a@b.com", shipping=SHIPPING)
        mark_order_paid(order)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 3)

    def test_mark_order_paid_decrements_stock_only_once(self):
        order = create_order_from_cart(self._cart(quantity=2), email="a@b.com", shipping=SHIPPING)
        mark_order_paid(order)
        mark_order_paid(order)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 3)

    def test_mark_order_paid_sends_one_confirmation_email(self):
        order = create_order_from_cart(self._cart(), email="a@b.com", shipping=SHIPPING)
        mark_order_paid(order)
        self.assertEqual(len(mail.outbox), 1)

    def test_mark_order_paid_clears_the_cart(self):
        cart = self._cart()
        order = create_order_from_cart(cart, email="a@b.com", shipping=SHIPPING)
        mark_order_paid(order)
        self.assertFalse(Cart.objects.filter(token=cart.token).exists())


class CheckoutApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Apparel", slug="apparel")
        product = Product.objects.create(
            name="Tee", slug="tee", category=category, base_price=Decimal("10.00")
        )
        self.variant = ProductVariant.objects.create(
            product=product, name="Medium", sku="TEE-M", stock_quantity=5
        )
        self.cart = Cart.objects.create()
        CartItem.objects.create(cart=self.cart, variant=self.variant, quantity=1)

    def _checkout(self, token=None):
        headers = {"X-Cart-Token": str(token)} if token else {}
        return self.client.post(
            "/api/checkout/", {"email": "a@b.com", **SHIPPING}, format="json", headers=headers
        )

    def test_checkout_returns_a_checkout_url(self):
        response = self._checkout(token=self.cart.token)
        self.assertIn("/checkout/success", response.data["checkout_url"])

    def test_checkout_without_cart_is_rejected(self):
        response = self._checkout()
        self.assertEqual(response.status_code, 400)

    def test_confirm_marks_order_paid(self):
        reference = self._checkout(token=self.cart.token).data["reference"]
        response = self.client.post("/api/checkout/confirm/", {"reference": reference}, format="json")
        self.assertEqual(response.data["status"], "paid")

    def test_webhook_rejects_invalid_signature(self):
        response = self.client.post(
            "/api/stripe/webhook/", data="{}", content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    @patch("apps.orders.views.stripe.Webhook.construct_event")
    def test_webhook_marks_order_paid(self, construct_event):
        reference = self._checkout(token=self.cart.token).data["reference"]
        construct_event.return_value = {
            "type": "checkout.session.completed",
            "data": {"object": {"metadata": {"order_reference": reference}, "payment_intent": "pi_1"}},
        }
        self.client.post("/api/stripe/webhook/", data="{}", content_type="application/json")
        self.assertEqual(Order.objects.get(reference=reference).status, "paid")
