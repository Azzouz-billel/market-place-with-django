from django.urls import path

from .views import (
    CustomersView,
    OrdersView,
    OrderStatusView,
    ProductActiveView,
    ProductsView,
    StatsView,
)

urlpatterns = [
    path("dashboard/stats/", StatsView.as_view(), name="dashboard-stats"),
    path("dashboard/orders/", OrdersView.as_view(), name="dashboard-orders"),
    path("dashboard/orders/<uuid:reference>/", OrderStatusView.as_view(), name="dashboard-order-status"),
    path("dashboard/products/", ProductsView.as_view(), name="dashboard-products"),
    path("dashboard/products/<slug:slug>/", ProductActiveView.as_view(), name="dashboard-product-active"),
    path("dashboard/customers/", CustomersView.as_view(), name="dashboard-customers"),
]
