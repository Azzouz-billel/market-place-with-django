from rest_framework import serializers


class SubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField()
