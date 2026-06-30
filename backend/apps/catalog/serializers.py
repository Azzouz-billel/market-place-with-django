from rest_framework import serializers

from .models import Category, Product, ProductImage, ProductVariant


class RatingFieldsMixin(serializers.Serializer):
    """average_rating / review_count from queryset annotations (safe defaults)."""

    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0) or 0

    def get_average_rating(self, obj):
        value = getattr(obj, "average_rating", None)
        return round(value, 1) if value is not None else None


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "description", "image"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "order"]


class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = ["id", "name", "sku", "price_override", "effective_price", "stock_quantity", "in_stock"]


class ProductListSerializer(RatingFieldsMixin, serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    primary_image = ProductImageSerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "base_price", "category", "primary_image",
            "average_rating", "review_count",
        ]


class ProductDetailSerializer(RatingFieldsMixin, serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    related = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "base_price",
            "category",
            "images",
            "variants",
            "meta_title",
            "meta_description",
            "created_at",
            "average_rating",
            "review_count",
            "related",
        ]

    def get_related(self, obj):
        from django.db.models import Avg, Count

        qs = (
            Product.objects.filter(is_active=True, category=obj.category)
            .exclude(pk=obj.pk)
            .annotate(review_count=Count("reviews"), average_rating=Avg("reviews__rating"))[:4]
        )
        return ProductListSerializer(qs, many=True, context=self.context).data
