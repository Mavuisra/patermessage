from django.db import models


class PaymentRecord(models.Model):
    class Kind(models.TextChoices):
        SUBSCRIPTION = "subscription", "Abonnement mensuel"
        PREMIUM_MESSAGE = "premium_message", "Message premium"
        CALL_BOOKING = "call_booking", "Réservation appel"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        SUCCEEDED = "succeeded", "Réussi"
        FAILED = "failed", "Échoué"
        REFUNDED = "refunded", "Remboursé"

    kind = models.CharField(max_length=30, choices=Kind.choices)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, default="usd")
    receipt_number = models.CharField(max_length=32, blank=True, unique=True, null=True)
    receipt_pdf = models.FileField(upload_to="receipts/%Y/%m/", blank=True, null=True)
    period_start = models.DateTimeField(null=True, blank=True)
    period_end = models.DateTimeField(null=True, blank=True)
    customer_email = models.EmailField()
    customer_name = models.CharField(max_length=120, blank=True)
    stripe_session_id = models.CharField(max_length=200, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True)
    reference_id = models.PositiveIntegerField(help_text="ID message ou booking")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.kind} — {self.amount_cents / 100:.2f} {self.currency}"
