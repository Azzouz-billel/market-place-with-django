from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import ProductVariant
from apps.discounts.services import CouponError, get_valid_coupon

from .models import Cart, CartItem
from .serializers import AddItemSerializer, CartSerializer, UpdateItemSerializer

TOKEN_HEADER = "X-Cart-Token"

EMPTY_CART = {
    "token": None,
    "items": [],
    "subtotal": "0.00",
    "discount": "0.00",
    "total": "0.00",
    "coupon_code": None,
    "total_quantity": 0,
}


def _resolve_cart(request, *, create=False):
    """Return the Cart for the request's token, optionally creating one."""
    token = request.headers.get(TOKEN_HEADER)
    if token:
        cart = Cart.objects.filter(token=token).first()
        if cart:
            return cart
    return Cart.objects.create() if create else None


def _cart_response(cart):
    return Response(CartSerializer(cart).data)


class CartView(APIView):
    def get(self, request):
        cart = _resolve_cart(request)
        if cart is None:
            return Response(EMPTY_CART)
        return _cart_response(cart)


class CartItemsView(APIView):
    def post(self, request):
        payload = AddItemSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        variant = ProductVariant.objects.filter(
            pk=payload.validated_data["variant_id"], product__is_active=True
        ).first()
        if variant is None:
            return Response(
                {"detail": "Product variant is not available."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if variant.stock_quantity == 0:
            return Response(
                {"detail": "This option is out of stock."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = _resolve_cart(request, create=True)
        item, created = CartItem.objects.get_or_create(cart=cart, variant=variant)
        current = 0 if created else item.quantity
        # Never let cart quantity exceed available stock.
        item.quantity = min(current + payload.validated_data["quantity"], variant.stock_quantity)
        item.save()
        return _cart_response(cart)


class CartItemDetailView(APIView):
    def _get_item(self, request, pk):
        cart = _resolve_cart(request)
        if cart is None:
            return None, None
        return cart, cart.items.filter(pk=pk).first()

    def patch(self, request, pk):
        cart, item = self._get_item(request, pk)
        if item is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        payload = UpdateItemSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        item.quantity = min(payload.validated_data["quantity"], item.variant.stock_quantity)
        item.save()
        return _cart_response(cart)

    def delete(self, request, pk):
        cart, item = self._get_item(request, pk)
        if item is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return _cart_response(cart)


class CartCouponView(APIView):
    def post(self, request):
        cart = _resolve_cart(request)
        if cart is None or not cart.items.exists():
            return Response(
                {"detail": "Add items to your cart first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        code = (request.data.get("code") or "").strip()
        if not code:
            return Response({"detail": "Enter a coupon code."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            coupon = get_valid_coupon(code, cart.subtotal)
        except CouponError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        cart.coupon = coupon
        cart.save(update_fields=["coupon", "updated_at"])
        return _cart_response(cart)

    def delete(self, request):
        cart = _resolve_cart(request)
        if cart is None:
            return Response(EMPTY_CART)
        cart.coupon = None
        cart.save(update_fields=["coupon", "updated_at"])
        return _cart_response(cart)
