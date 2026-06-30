import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart

from .models import Order
from .payments import confirm_order, create_checkout_session, mark_order_paid
from .serializers import CheckoutSerializer, OrderSerializer
from .services import CheckoutError, create_order_from_cart

CART_TOKEN_HEADER = "X-Cart-Token"


class CheckoutView(APIView):
    def post(self, request):
        form = CheckoutSerializer(data=request.data)
        form.is_valid(raise_exception=True)

        token = request.headers.get(CART_TOKEN_HEADER)
        cart = Cart.objects.filter(token=token).first() if token else None
        if cart is None:
            return Response({"detail": "Your cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        email = form.validated_data.pop("email")
        user = request.user if request.user.is_authenticated else None
        try:
            order = create_order_from_cart(cart, email=email, shipping=form.validated_data, user=user)
        except CheckoutError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        success_url = f"{settings.FRONTEND_BASE_URL}/checkout/success?ref={order.reference}"
        cancel_url = f"{settings.FRONTEND_BASE_URL}/cart"
        checkout_url = create_checkout_session(order, success_url=success_url, cancel_url=cancel_url)

        return Response({"checkout_url": checkout_url, "reference": str(order.reference)})


class ConfirmView(APIView):
    def post(self, request):
        reference = request.data.get("reference")
        if not reference:
            return Response({"detail": "Missing order reference."}, status=status.HTTP_400_BAD_REQUEST)
        order = get_object_or_404(Order, reference=reference)
        confirm_order(order)
        return Response(OrderSerializer(order).data)


class OrderDetailView(APIView):
    def get(self, request, reference):
        order = get_object_or_404(Order, reference=reference)
        return Response(OrderSerializer(order).data)


class StripeWebhookView(APIView):
    authentication_classes = []

    def post(self, request):
        try:
            event = stripe.Webhook.construct_event(
                payload=request.body,
                sig_header=request.headers.get("Stripe-Signature"),
                secret=settings.STRIPE_WEBHOOK_SECRET,
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            reference = session.get("metadata", {}).get("order_reference")
            order = Order.objects.filter(reference=reference).first() if reference else None
            if order is not None:
                mark_order_paid(order, payment_intent=session.get("payment_intent") or "")

        return Response(status=status.HTTP_200_OK)
