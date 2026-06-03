from rest_framework import serializers

from .models import DeviceToken, NotificationLog


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ("id", "token", "platform", "created_at")


class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = ("id", "title", "body", "data", "sent_at", "success_count")
