from django.conf import settings
from rest_framework import serializers

from .models import PlatformSettings, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "display_name",
            "phone",
            "occupation",
            "avatar_url",
            "role",
        )


class VisitorRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    occupation = serializers.CharField(max_length=200)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return email


class VisitorLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class VisitorProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, required=False)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    occupation = serializers.CharField(max_length=200, required=False)


class PlatformPublicSerializer(serializers.ModelSerializer):
    premium_message_price = serializers.SerializerMethodField()
    call_price = serializers.SerializerMethodField()
    stripe_publishable_key = serializers.SerializerMethodField()

    class Meta:
        model = PlatformSettings
        fields = (
            "display_name",
            "tagline",
            "bio",
            "avatar_url",
            "premium_message_price",
            "call_price",
            "free_messages_per_day",
            "social_links",
            "stripe_publishable_key",
        )

    def get_premium_message_price(self, obj) -> dict:
        from django.conf import settings

        return {
            "cents": settings.SUBSCRIPTION_PRICE_CENTS,
            "currency": settings.SUBSCRIPTION_CURRENCY,
        }

    def get_call_price(self, obj) -> dict:
        return {"cents": obj.call_price_cents, "currency": "usd"}

    def get_stripe_publishable_key(self, obj) -> str:
        return settings.STRIPE_PUBLISHABLE_KEY


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
