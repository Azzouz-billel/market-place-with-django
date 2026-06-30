from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductImage, ProductVariant


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "parent"]
    list_filter = ["parent"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ["image", "thumbnail", "alt_text", "is_primary", "order"]
    readonly_fields = ["thumbnail"]

    @admin.display(description="Preview")
    def thumbnail(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:60px;border-radius:4px;" />', obj.image.url)
        return "—"


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "base_price", "is_active", "thumbnail"]
    list_filter = ["category", "is_active"]
    search_fields = ["name", "slug", "description"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductVariantInline]
    actions = ["make_active", "make_inactive"]

    @admin.display(description="Image")
    def thumbnail(self, obj):
        image = obj.primary_image
        if image:
            return format_html('<img src="{}" style="height:40px;border-radius:4px;" />', image.image.url)
        return "—"

    @admin.action(description="Mark selected products as active")
    def make_active(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Mark selected products as inactive")
    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)
