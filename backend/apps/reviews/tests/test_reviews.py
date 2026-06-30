from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.catalog.models import Category, Product
from apps.reviews.models import Review

User = get_user_model()


def _product():
    category = Category.objects.create(name="Apparel", slug="apparel")
    return Product.objects.create(name="Tee", slug="tee", category=category, base_price=Decimal("10.00"))


class ReviewApiTests(APITestCase):
    def setUp(self):
        self.product = _product()
        self.user = User.objects.create_user(email="ada@example.com", password="s3cret-pw-99")
        self.token = Token.objects.create(user=self.user)

    def _auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_posting_a_review_requires_authentication(self):
        response = self.client.post("/api/products/tee/reviews/", {"rating": 5}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_post_a_review(self):
        self._auth()
        self.client.post("/api/products/tee/reviews/", {"rating": 5, "comment": "Great"}, format="json")
        self.assertEqual(Review.objects.filter(product=self.product).count(), 1)

    def test_rating_must_be_within_range(self):
        self._auth()
        response = self.client.post("/api/products/tee/reviews/", {"rating": 6}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_second_review_by_same_user_updates_instead_of_duplicating(self):
        self._auth()
        self.client.post("/api/products/tee/reviews/", {"rating": 4}, format="json")
        self.client.post("/api/products/tee/reviews/", {"rating": 2}, format="json")
        self.assertEqual(Review.objects.get(product=self.product, user=self.user).rating, 2)


class ProductRatingAggregateTests(APITestCase):
    def test_detail_reports_average_rating_and_count(self):
        product = _product()
        for index, rating in enumerate((4, 5)):
            user = User.objects.create_user(email=f"u{index}@example.com", password="s3cret-pw-99")
            Review.objects.create(product=product, user=user, rating=rating)
        response = self.client.get("/api/products/tee/")
        self.assertEqual(response.data["average_rating"], 4.5)

    def test_detail_reports_review_count(self):
        product = _product()
        user = User.objects.create_user(email="u@example.com", password="s3cret-pw-99")
        Review.objects.create(product=product, user=user, rating=3)
        response = self.client.get("/api/products/tee/")
        self.assertEqual(response.data["review_count"], 1)
