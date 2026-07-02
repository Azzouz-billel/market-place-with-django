from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from rest_framework import status
from rest_framework.generics import ListAPIView, get_object_or_404
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product, ProductVariant
from apps.marketing.models import NewsletterSubscriber
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer

from .serializers import (
    CustomerSerializer,
    DashboardProductSerializer,
    LowStockSerializer,
)

User = get_user_model()

REVENUE_STATUSES = [Order.Status.PAID, Order.Status.SHIPPED, Order.Status.DELIVERED]
LOW_STOCK_THRESHOLD = 3


class StatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = Order.objects.all()
        by_status = {
            row["status"]: row["count"]
            for row in orders.values("status").annotate(count=Count("id"))
        }
        revenue = (
            orders.filter(status__in=REVENUE_STATUSES).aggregate(total=Sum("total"))["total"]
            or Decimal("0.00")
        )
        low_stock = (
            ProductVariant.objects.select_related("product")
            .filter(stock_quantity__lte=LOW_STOCK_THRESHOLD, product__is_active=True)
            .order_by("stock_quantity")[:10]
        )
        recent = orders.prefetch_related("items")[:8]
        return Response(
            {
                "revenue": revenue,
                "orders_total": orders.count(),
                "orders_by_status": by_status,
                "products_total": Product.objects.count(),
                "products_active": Product.objects.filter(is_active=True).count(),
                "customers": User.objects.filter(is_staff=False).count(),
                "subscribers": NewsletterSubscriber.objects.filter(is_active=True).count(),
                "low_stock": LowStockSerializer(low_stock, many=True).data,
                "recent_orders": OrderSerializer(recent, many=True).data,
            }
        )


class OrdersView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]
    queryset = Order.objects.prefetch_related("items")
    filterset_fields = ["status"]
    search_fields = ["email"]
    ordering_fields = ["created_at", "total"]


class OrderStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, reference):
        order = get_object_or_404(Order, reference=reference)
        new_status = request.data.get("status")
        if new_status not in Order.Status.values:
            return Response(
                {"detail": f"Status must be one of: {', '.join(Order.Status.values)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # A manual override for fulfilment tracking; it does not decrement stock
        # or send emails — those happen once via the payment confirmation path.
        order.status = new_status
        order.save(update_fields=["status", "updated_at"])
        return Response(OrderSerializer(order).data)


class ProductsView(ListAPIView):
    serializer_class = DashboardProductSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None
    queryset = (
        Product.objects.select_related("category").prefetch_related("variants").order_by("name")
    )
    filter_backends = []


class ProductActiveView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, slug):
        product = get_object_or_404(Product, slug=slug)
        product.is_active = bool(request.data.get("is_active"))
        product.save(update_fields=["is_active", "updated_at"])
        return Response(DashboardProductSerializer(product).data)


class CustomersView(ListAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return User.objects.annotate(order_count=Count("orders")).order_by("-date_joined")
