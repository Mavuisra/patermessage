from django.db import models


class InboundMessage(models.Model):
    class Tier(models.TextChoices):
        FREE = "free", "Gratuit"
        PREMIUM = "premium", "Premium"

    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "Paiement en attente"
        PAID = "paid", "Payé"
        ANALYZING = "analyzing", "Analyse en cours"
        ANALYZED = "analyzed", "Analysé"
        ARCHIVED = "archived", "Archivé"

    sender_name = models.CharField(max_length=120)
    sender_email = models.EmailField()
    sender_phone = models.CharField(max_length=40, blank=True)
    sender_occupation = models.CharField(max_length=200, blank=True)
    subject = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    voice_note = models.FileField(upload_to="voice/%Y/%m/", blank=True, null=True)
    tier = models.CharField(max_length=20, choices=Tier.choices, default=Tier.FREE)
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.ANALYZING,
    )
    is_priority = models.BooleanField(default=False)
    stripe_payment_intent_id = models.CharField(max_length=120, blank=True)
    amount_cents = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_priority", "-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["tier", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.sender_name}: {self.subject or self.body[:40]}"


class MessageAnalysis(models.Model):
    message = models.OneToOneField(
        InboundMessage,
        on_delete=models.CASCADE,
        related_name="analysis",
    )
    summary = models.TextField(blank=True)
    relevance_score = models.FloatField(default=0.0)
    opportunity_detected = models.BooleanField(default=False)
    opportunity_details = models.TextField(blank=True)
    suggested_reply = models.TextField(blank=True)
    sentiment = models.CharField(max_length=40, blank=True)
    tags = models.JSONField(default=list, blank=True)
    raw_ai_response = models.JSONField(default=dict, blank=True)
    analyzed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Analysis #{self.message_id} — score {self.relevance_score}"


class OwnerReply(models.Model):
    message = models.ForeignKey(
        InboundMessage,
        on_delete=models.CASCADE,
        related_name="replies",
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Reply to #{self.message_id}: {self.body[:40]}"
