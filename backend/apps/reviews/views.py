from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product

from .models import Review
from .serializers import ReviewInputSerializer, ReviewSerializer


class ProductReviewsView(APIView):
    def get_permissions(self):
        # Anyone can read reviews; only signed-in users can write one.
        return [IsAuthenticated()] if self.request.method == "POST" else []

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug)
        reviews = product.reviews.select_related("user")
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request, slug):
        product = get_object_or_404(Product, slug=slug)
        payload = ReviewInputSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        review, _ = Review.objects.update_or_create(
            product=product,
            user=request.user,
            defaults=payload.validated_data,
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
