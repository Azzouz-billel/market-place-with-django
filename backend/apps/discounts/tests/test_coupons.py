from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.cart.models import Cart, CartItem
from apps.catalog.models import Category, Product, ProductVariant
from apps.discounts.models import Coupon
from apps.discounts.services import CouponError, get_valid_coupon
from apps.orders.services import create_order_from_cart

SHIPPING = {
    "shipping_name": "Ada",
    "shipping_line1": "1 Way",
    "shipping_city": "London",
    "shipping_postal_code": "EC1",
    "shipping_country": "GB",
}


class CouponModelTests(APITestCase):
    def test_percentage_discount_is_a_fraction_of_subtotal(self):
        coupon = Coupon.objects.create(code="TEN", discount_type="percent", value=Decimal("10"))
        self.assertEqual(coupon.discount_for(Decimal("100.00")), Decimal("10.00"))

    def test_fixed_discount_is_capped_at_subtotal(self):
        coupon = Coupon.objects.create(code="BIG", discount_type="fixed", value=Decimal("100"))
        self.assertEqual(coupon.discount_for(Decimal("20.00")), Decimal("20.00"))

    def test_code_is_stored_uppercase(self):
        coupon = Coupon.objects.create(code="welcome", discount_type="fixed", value=Decimal("5"))
        self.assertEqual(coupon.code, "WELCOME")


class GetValidCouponTests(APITestCase):
    def test_unknown_code_is_rejected(self):
        with self.assertRaises(CouponError):
            get_valid_coupon("NOPE", Decimal("50.00"))

    def test_inactive_coupon_is_rejected(self):
        Coupon.objects.create(code="OFF", discount_type="percent", value=Decimal("10"), active=False)
        with self.assertRaises(CouponError):
            get_valid_coupon("OFF", Decimal("50.00"))

    def test_expired_coupon_is_rejected(self):
        Coupon.objects.create(
            code="OLD", discount_type="percent", value=Decimal("10"),
            valid_to=timezone.now() - timedelta(days=1),
        )
        with self.assertRaises(CouponError):
            get_valid_coupon("OLD", Decimal("50.00"))

    def test_below_minimum_subtotal_is_rejected(self):
        Coupon.objects.create(
            code="MIN", discount_type="fixed", value=Decimal("5"), min_subtotal=Decimal("75.00")
        )
        with self.assertRaises(CouponError):
            get_valid_coupon("MIN", Decimal("50.00"))


class CartCouponApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Apparel", slug="apparel")
        product = Product.objects.create(
            name="Tee", slug="tee", category=category, base_price=Decimal("10.00")
        )
        self.variant = ProductVariant.objects.create(
            product=product, name="Medium", sku="TEE-M", stock_quantity=5
        )
        self.cart = Cart.objects.create()
        CartItem.objects.create(cart=self.cart, variant=self.variant, quantity=2)
        Coupon.objects.create(code="TEN", discount_type="percent", value=Decimal("10"))

    def _headers(self):
        return {"X-Cart-Token": str(self.cart.token)}

    def test_applying_a_coupon_discounts_the_total(self):
        response = self.client.post(
            "/api/cart/coupon/", {"code": "TEN"}, format="json", headers=self._headers()
        )
        self.assertEqual(response.data["total"], "18.00")

    def test_applying_an_unknown_code_is_rejected(self):
        response = self.client.post(
            "/api/cart/coupon/", {"code": "NOPE"}, format="json", headers=self._headers()
        )
        self.assertEqual(response.status_code, 400)

    def test_removing_a_coupon_restores_the_total(self):
        self.client.post("/api/cart/coupon/", {"code": "TEN"}, format="json", headers=self._headers())
        response = self.client.delete("/api/cart/coupon/", headers=self._headers())
        self.assertEqual(response.data["total"], "20.00")


class CheckoutDiscountTests(APITestCase):
    def test_order_snapshots_the_cart_discount(self):
        category = Category.objects.create(name="Apparel", slug="apparel")
        product = Product.objects.create(
            name="Tee", slug="tee", category=category, base_price=Decimal("10.00")
        )
        variant = ProductVariant.objects.create(
            product=product, name="Medium", sku="TEE-M", stock_quantity=5
        )
        coupon = Coupon.objects.create(code="TEN", discount_type="percent", value=Decimal("10"))
        cart = Cart.objects.create(coupon=coupon)
        CartItem.objects.create(cart=cart, variant=variant, quantity=2)
        order = create_order_from_cart(cart, email="a@b.com", shipping=SHIPPING)
        self.assertEqual(order.total, Decimal("18.00"))
