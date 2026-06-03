from urllib.parse import quote

from rest_framework import serializers

from .models import PaymentRecord
from .subscription import format_money

class PaymentRecordSerializer(serializers.ModelSerializer):
    amount_display = serializers.SerializerMethodField()
    receipt_url = serializers.SerializerMethodField()
    period_label = serializers.SerializerMethodField()

    class Meta:
        model = PaymentRecord
        fields = (
            "id",
            "kind",
            "status",
            "amount_cents",
            "amount_display",
            "currency",
            "customer_email",
            "customer_name",
            "receipt_number",
            "receipt_url",
            "period_start",
            "period_end",
            "period_label",
            "created_at",
            "paid_at",
        )

    def get_amount_display(self, obj) -> str:
        return format_money(obj.amount_cents, obj.currency)

    def get_receipt_url(self, obj) -> str | None:
        request = self.context.get("request")
        if obj.status != PaymentRecord.Status.SUCCEEDED:
            return None
        path = f"/api/payments/{obj.id}/receipt.pdf?email={quote(obj.customer_email)}"
        if request:
            return request.build_absolute_uri(path)
        return path

    def get_period_label(self, obj) -> str | None:
        if obj.period_start and obj.period_end:
            return (
                f"{obj.period_start.strftime('%d/%m/%Y')} — "
                f"{obj.period_end.strftime('%d/%m/%Y')}"
            )
        return None
