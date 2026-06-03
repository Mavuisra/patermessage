from django.contrib import admin

from .models import PaymentRecord


@admin.register(PaymentRecord)
class PaymentRecordAdmin(admin.ModelAdmin):
    list_display = ("kind", "status", "amount_cents", "customer_email", "created_at")
    list_filter = ("kind", "status")
