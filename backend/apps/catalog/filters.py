import django_filters
from django.db import connection
from django.db.models import Q

from .models import Product


class ProductFilter(django_filters.FilterSet):
    """Filter products by category slug, a base-price range, and a search term."""

    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="exact")
    min_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="lte")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Product
        fields = ["category", "min_price", "max_price", "search"]

    def filter_search(self, queryset, name, value):
        value = value.strip()
        if not value:
            return queryset
        # Postgres gets ranked full-text search; SQLite (dev) falls back to icontains.
        if connection.vendor == "postgresql":
            from django.contrib.postgres.search import (
                SearchQuery,
                SearchRank,
                SearchVector,
            )

            vector = SearchVector("name", weight="A") + SearchVector("description", weight="B")
            query = SearchQuery(value)
            return (
                queryset.annotate(rank=SearchRank(vector, query))
                .filter(rank__gt=0)
                .order_by("-rank")
            )
        return queryset.filter(Q(name__icontains=value) | Q(description__icontains=value))
