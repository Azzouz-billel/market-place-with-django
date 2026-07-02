from django.contrib import admin

from .models import Currency


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "symbol", "rate", "is_default"]
    list_editable = ["rate", "is_default"]
    search_fields = ["code", "name"]
