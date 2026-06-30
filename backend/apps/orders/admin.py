from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = ["product_name", "variant_name", "sku", "unit_price", "quantity"]

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["reference", "email", "status", "total", "created_at", "paid_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["reference", "email", "shipping_name"]
    list_editable = ["status"]
    date_hierarchy = "created_at"
    inlines = [OrderItemInline]
    readonly_fields = [
        "reference",
        "email",
        "total",
        "stripe_session_id",
        "stripe_payment_intent",
        "cart_token",
        "created_at",
        "updated_at",
        "paid_at",
    ]
