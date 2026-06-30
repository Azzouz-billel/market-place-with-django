from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product_name", "variant_name", "sku", "unit_price", "quantity", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "reference",
            "email",
            "status",
            "subtotal",
            "discount",
            "coupon_code",
            "total",
            "created_at",
            "paid_at",
            "items",
            "shipping_name",
            "shipping_line1",
            "shipping_line2",
            "shipping_city",
            "shipping_state",
            "shipping_postal_code",
            "shipping_country",
            "phone",
        ]


class CheckoutSerializer(serializers.Serializer):
    email = serializers.EmailField()
    shipping_name = serializers.CharField(max_length=200)
    shipping_line1 = serializers.CharField(max_length=200)
    shipping_line2 = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    shipping_city = serializers.CharField(max_length=120)
    shipping_state = serializers.CharField(max_length=120, required=False, allow_blank=True, default="")
    shipping_postal_code = serializers.CharField(max_length=20)
    shipping_country = serializers.CharField(max_length=2)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True, default="")
