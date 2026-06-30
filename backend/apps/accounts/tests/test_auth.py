from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.cart.models import Cart, CartItem
from apps.catalog.models import Category, Product, ProductVariant
from apps.orders.models import Order

User = get_user_model()

PASSWORD = "s3cret-pw-99"
SHIPPING = {
    "shipping_name": "Ada Lovelace",
    "shipping_line1": "1 Analytical Way",
    "shipping_city": "London",
    "shipping_postal_code": "EC1A 1AA",
    "shipping_country": "GB",
}


class AuthApiTests(APITestCase):
    def test_register_returns_a_token(self):
        response = self.client.post(
            "/api/auth/register/", {"email": "ada@example.com", "password": PASSWORD}, format="json"
        )
        self.assertTrue(response.data["token"])

    def test_register_creates_the_user(self):
        self.client.post(
            "/api/auth/register/", {"email": "ada@example.com", "password": PASSWORD}, format="json"
        )
        self.assertTrue(User.objects.filter(email="ada@example.com").exists())

    def test_login_returns_a_token(self):
        User.objects.create_user(email="ada@example.com", password=PASSWORD)
        response = self.client.post(
            "/api/auth/login/", {"email": "ada@example.com", "password": PASSWORD}, format="json"
        )
        self.assertTrue(response.data["token"])

    def test_login_rejects_wrong_password(self):
        User.objects.create_user(email="ada@example.com", password=PASSWORD)
        response = self.client.post(
            "/api/auth/login/", {"email": "ada@example.com", "password": "wrong"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)

    def test_me_returns_the_current_user(self):
        token = self.client.post(
            "/api/auth/register/", {"email": "ada@example.com", "password": PASSWORD}, format="json"
        ).data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.data["email"], "ada@example.com")


class AuthenticatedCheckoutTests(APITestCase):
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
        self.user = User.objects.create_user(email="ada@example.com", password=PASSWORD)

    def test_checkout_attaches_order_to_authenticated_user(self):
        token = self.client.post(
            "/api/auth/login/", {"email": "ada@example.com", "password": PASSWORD}, format="json"
        ).data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        response = self.client.post(
            "/api/checkout/",
            {"email": "ada@example.com", **SHIPPING},
            format="json",
            headers={"X-Cart-Token": str(self.cart.token)},
        )
        order = Order.objects.get(reference=response.data["reference"])
        self.assertEqual(order.user, self.user)
