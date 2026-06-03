from django.conf import settings
from django.db import models


class DeviceToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="device_tokens",
    )
    token = models.CharField(max_length=512, unique=True)
    platform = models.CharField(max_length=20, default="web")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.username} — {self.platform}"


class NotificationLog(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    success_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-sent_at"]
