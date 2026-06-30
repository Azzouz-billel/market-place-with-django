from django.db.models import Avg, Count
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.generics import ListAPIView, get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product
from apps.catalog.serializers import ProductListSerializer
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer

from .models import WishlistItem
from .serializers import (
    AddressSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)


def _serialize_wishlist(request):
    products = (
        Product.objects.filter(wishlisted_by__user=request.user, is_active=True)
        .select_related("category")
        .prefetch_related("images")
        .annotate(review_count=Count("reviews"), average_rating=Avg("reviews__rating"))
        .order_by("-wishlisted_by__created_at")
    )
    return ProductListSerializer(products, many=True, context={"request": request}).data


def _auth_response(user):
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user).data})


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return _auth_response(user)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return _auth_response(serializer.validated_data["user"])


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return self.request.user.addresses.all()

    def perform_create(self, serializer):
        address = serializer.save(user=self.request.user)
        self._enforce_single_default(address)

    def perform_update(self, serializer):
        address = serializer.save()
        self._enforce_single_default(address)

    def _enforce_single_default(self, address):
        if address.is_default:
            self.request.user.addresses.exclude(pk=address.pk).update(is_default=False)


class MyOrdersView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_serialize_wishlist(request))

    def post(self, request):
        product = get_object_or_404(Product, slug=request.data.get("slug"), is_active=True)
        WishlistItem.objects.get_or_create(user=request.user, product=product)
        return Response(_serialize_wishlist(request), status=status.HTTP_201_CREATED)


class WishlistItemView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, slug):
        WishlistItem.objects.filter(user=request.user, product__slug=slug).delete()
        return Response(_serialize_wishlist(request))
