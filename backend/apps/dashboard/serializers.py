from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.catalog.models import Product, ProductVariant

User = get_user_model()


class LowStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name")
    product_slug = serializers.SlugField(source="product.slug")

    class Meta:
        model = ProductVariant
        fields = ["id", "product_name", "product_slug", "name", "sku", "stock_quantity"]


class DashboardVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "name", "sku", "stock_quantity"]


class DashboardProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name")
    variants = DashboardVariantSerializer(many=True, read_only=True)
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "base_price",
            "is_active",
            "category_name",
            "total_stock",
            "variants",
        ]

    def get_total_stock(self, product):
        return sum(variant.stock_quantity for variant in product.variants.all())


class CustomerSerializer(serializers.ModelSerializer):
    order_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "is_staff", "date_joined", "order_count"]
