from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.accounts.models import Address
from apps.orders.models import Order

User = get_user_model()

ADDRESS = {
    "full_name": "Ada Lovelace",
    "line1": "1 Analytical Way",
    "city": "London",
    "postal_code": "EC1A 1AA",
    "country": "GB",
}


class AddressApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="ada@example.com", password="s3cret-pw-99")
        self.token = Token.objects.create(user=self.user)

    def _auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_creating_an_address_requires_authentication(self):
        response = self.client.post("/api/account/addresses/", ADDRESS, format="json")
        self.assertEqual(response.status_code, 401)

    def test_created_address_belongs_to_the_user(self):
        self._auth()
        self.client.post("/api/account/addresses/", ADDRESS, format="json")
        self.assertEqual(self.user.addresses.count(), 1)

    def test_list_excludes_other_users_addresses(self):
        other = User.objects.create_user(email="other@example.com", password="s3cret-pw-99")
        Address.objects.create(user=other, **ADDRESS)
        self._auth()
        response = self.client.get("/api/account/addresses/")
        self.assertEqual(response.data, [])

    def test_setting_a_new_default_unsets_the_previous_one(self):
        self._auth()
        first = self.client.post(
            "/api/account/addresses/", {**ADDRESS, "is_default": True}, format="json"
        ).data["id"]
        self.client.post("/api/account/addresses/", {**ADDRESS, "is_default": True}, format="json")
        self.assertFalse(Address.objects.get(pk=first).is_default)


class OrderHistoryApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="ada@example.com", password="s3cret-pw-99")
        self.token = Token.objects.create(user=self.user)
        Order.objects.create(user=self.user, email="ada@example.com", total=Decimal("10.00"))

    def test_order_history_requires_authentication(self):
        response = self.client.get("/api/account/orders/")
        self.assertEqual(response.status_code, 401)

    def test_order_history_lists_only_the_users_orders(self):
        other = User.objects.create_user(email="other@example.com", password="s3cret-pw-99")
        Order.objects.create(user=other, email="other@example.com", total=Decimal("5.00"))
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        response = self.client.get("/api/account/orders/")
        self.assertEqual(len(response.data), 1)