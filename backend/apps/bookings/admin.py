from django.contrib import admin

from .models import AvailabilitySlot, CallBooking


@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ("start_at", "end_at", "is_booked")


@admin.register(CallBooking)
class CallBookingAdmin(admin.ModelAdmin):
    list_display = ("guest_name", "status", "slot", "created_at")
    list_filter = ("status",)
