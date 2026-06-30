from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AddressViewSet,
    LoginView,
    LogoutView,
    MeView,
    MyOrdersView,
    RegisterView,
)

router = DefaultRouter()
router.register("account/addresses", AddressViewSet, basename="address")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("account/orders/", MyOrdersView.as_view(), name="my-orders"),
    *router.urls,
]
