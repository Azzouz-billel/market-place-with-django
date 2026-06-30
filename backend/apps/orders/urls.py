from django.urls import path

from .views import CheckoutView, ConfirmView, OrderDetailView, StripeWebhookView

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("checkout/confirm/", ConfirmView.as_view(), name="checkout-confirm"),
    path("orders/<uuid:reference>/", OrderDetailView.as_view(), name="order-detail"),
    path("stripe/webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
