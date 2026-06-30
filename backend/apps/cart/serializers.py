from rest_framework import serializers

from apps.catalog.serializers import ProductImageSerializer

from .models import Cart, CartItem


class CartVariantSerializer(serializers.Serializer):
    """Compact view of a variant for display inside a cart line."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    sku = serializers.CharField()
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = serializers.IntegerField()
    in_stock = serializers.BooleanField()
    product_name = serializers.CharField(source="product.name")
    product_slug = serializers.SlugField(source="product.slug")
    product_image = serializers.SerializerMethodField()

    def get_product_image(self, variant):
        image = variant.product.primary_image
        if image is None:
            return None
        return ProductImageSerializer(image, context=self.context).data


class CartItemSerializer(serializers.ModelSerializer):
    variant = CartVariantSerializer(read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "variant", "quantity", "line_total"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    coupon_code = serializers.SerializerMethodField()
    total_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ["token", "items", "subtotal", "discount", "total", "coupon_code", "total_quantity"]

    def get_coupon_code(self, cart):
        return cart.coupon.code if cart.coupon and cart.discount > 0 else None


class AddItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
