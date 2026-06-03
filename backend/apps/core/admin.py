from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import PlatformSettings, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "is_staff")
    list_filter = ("role", "is_staff")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Profil", {"fields": ("role", "display_name", "avatar_url")}),
    )


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ("display_name", "premium_message_price_cents", "call_price_cents")
