from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.accounts.models import WishlistItem
from apps.catalog.models import Category, Product

User = get_user_model()


class WishlistApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Apparel", slug="apparel")
        self.product = Product.objects.create(
            name="Tee", slug="tee", category=category, base_price=Decimal("10.00")
        )
        self.other = Product.objects.create(
            name="Cap", slug="cap", category=category, base_price=Decimal("5.00")
        )
        self.user = User.objects.create_user(email="ada@example.com", password="s3cret-pw-99")
        self.token = Token.objects.create(user=self.user)

    def _auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_wishlist_requires_authentication(self):
        response = self.client.get("/api/account/wishlist/")
        self.assertEqual(response.status_code, 401)

    def test_adding_a_product_returns_it_in_the_wishlist(self):
        self._auth()
        response = self.client.post("/api/account/wishlist/", {"slug": "tee"}, format="json")
        self.assertEqual([p["slug"] for p in response.data], ["tee"])

    def test_adding_the_same_product_twice_keeps_one_entry(self):
        self._auth()
        self.client.post("/api/account/wishlist/", {"slug": "tee"}, format="json")
        self.client.post("/api/account/wishlist/", {"slug": "tee"}, format="json")
        self.assertEqual(WishlistItem.objects.filter(user=self.user).count(), 1)

    def test_removing_a_product_drops_it(self):
        self._auth()
        self.client.post("/api/account/wishlist/", {"slug": "tee"}, format="json")
        response = self.client.delete("/api/account/wishlist/tee/")
        self.assertEqual(response.data, [])

    def test_wishlist_is_scoped_to_the_user(self):
        other_user = User.objects.create_user(email="bob@example.com", password="s3cret-pw-99")
        WishlistItem.objects.create(user=other_user, product=self.other)
        self._auth()
        response = self.client.get("/api/account/wishlist/")
        self.assertEqual(response.data, [])
