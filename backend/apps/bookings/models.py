from django.db import models


class AvailabilitySlot(models.Model):
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    is_booked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["start_at"]
        indexes = [models.Index(fields=["start_at", "is_booked"])]

    def __str__(self) -> str:
        return f"{self.start_at} — {'réservé' if self.is_booked else 'libre'}"


class CallBooking(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "Paiement en attente"
        CONFIRMED = "confirmed", "Confirmé"
        COMPLETED = "completed", "Terminé"
        CANCELLED = "cancelled", "Annulé"

    slot = models.OneToOneField(
        AvailabilitySlot,
        on_delete=models.CASCADE,
        related_name="booking",
    )
    guest_name = models.CharField(max_length=120)
    guest_email = models.EmailField()
    topic = models.CharField(max_length=200)
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING_PAYMENT,
    )
    amount_cents = models.PositiveIntegerField(default=0)
    stripe_payment_intent_id = models.CharField(max_length=120, blank=True)
    meeting_link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.guest_name} — {self.slot.start_at}"
