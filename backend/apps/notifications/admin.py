from django.contrib import admin

from .models import DeviceToken, NotificationLog


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "created_at")


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("title", "success_count", "sent_at")
