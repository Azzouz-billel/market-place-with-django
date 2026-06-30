from django.contrib import admin

from .models import Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ["code", "discount_type", "value", "active", "valid_from", "valid_to", "min_subtotal"]
    list_filter = ["discount_type", "active"]
    list_editable = ["active"]
    search_fields = ["code"]
