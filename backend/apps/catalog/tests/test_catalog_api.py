from decimal import Decimal

from rest_framework.test import APITestCase

from apps.catalog.models import Category, Product, ProductImage, ProductVariant


class ProductListApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.apparel = Category.objects.create(name="Apparel", slug="apparel")
        cls.footwear = Category.objects.create(name="Footwear", slug="footwear")
        Product.objects.create(name="Tee", slug="tee", category=cls.apparel, base_price=Decimal("10.00"))
        Product.objects.create(name="Boot", slug="boot", category=cls.footwear, base_price=Decimal("50.00"))
        Product.objects.create(
            name="Hidden", slug="hidden", category=cls.apparel,
            base_price=Decimal("5.00"), is_active=False,
        )

    def _slugs(self, response):
        return [item["slug"] for item in response.data["results"]]

    def test_list_excludes_inactive_products(self):
        response = self.client.get("/api/products/")
        self.assertNotIn("hidden", self._slugs(response))

    def test_filter_by_category_returns_only_that_category(self):
        response = self.client.get("/api/products/?category=footwear")
        self.assertEqual(self._slugs(response), ["boot"])

    def test_search_matches_product_name(self):
        response = self.client.get("/api/products/?search=Tee")
        self.assertEqual(self._slugs(response), ["tee"])

    def test_ordering_by_price_ascending_puts_cheapest_first(self):
        response = self.client.get("/api/products/?ordering=base_price")
        self.assertEqual(self._slugs(response)[0], "tee")


class ProductDetailApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Apparel", slug="apparel")
        self.product = Product.objects.create(
            name="Tee", slug="tee", category=category, base_price=Decimal("10.00")
        )

    def test_detail_includes_variants(self):
        ProductVariant.objects.create(product=self.product, name="Small", sku="TEE-S", stock_quantity=3)
        response = self.client.get("/api/products/tee/")
        self.assertEqual(response.data["variants"][0]["name"], "Small")

    def test_detail_includes_images(self):
        ProductImage.objects.create(product=self.product, image="products/tee.jpg", is_primary=True)
        response = self.client.get("/api/products/tee/")
        self.assertEqual(len(response.data["images"]), 1)

    def test_detail_related_excludes_the_product_itself(self):
        response = self.client.get("/api/products/tee/")
        self.assertNotIn("tee", [item["slug"] for item in response.data["related"]])


class ProductVariantModelTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Apparel", slug="apparel")
        self.product = Product.objects.create(
            name="Tee", slug="tee", category=category, base_price=Decimal("10.00")
        )

    def test_effective_price_uses_override_when_set(self):
        variant = ProductVariant.objects.create(
            product=self.product, name="Large", sku="TEE-L", price_override=Decimal("12.50")
        )
        self.assertEqual(variant.effective_price, Decimal("12.50"))

    def test_effective_price_falls_back_to_base_price(self):
        variant = ProductVariant.objects.create(product=self.product, name="Small", sku="TEE-S")
        self.assertEqual(variant.effective_price, Decimal("10.00"))


class ProductImageModelTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Apparel", slug="apparel")
        self.product = Product.objects.create(
            name="Tee", slug="tee", category=category, base_price=Decimal("10.00")
        )

    def test_primary_image_prefers_the_flagged_image(self):
        ProductImage.objects.create(product=self.product, image="products/a.jpg", order=0, is_primary=False)
        flagged = ProductImage.objects.create(product=self.product, image="products/b.jpg", order=1, is_primary=True)
        self.assertEqual(self.product.primary_image, flagged)
