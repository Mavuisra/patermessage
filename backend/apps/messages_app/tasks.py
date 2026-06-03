from celery import shared_task

from apps.notifications.services import notify_owner

from .models import InboundMessage, MessageAnalysis
from .services.ai import analyze_message


@shared_task
def analyze_message_task(message_id: int):
    try:
        message = InboundMessage.objects.get(pk=message_id)
    except InboundMessage.DoesNotExist:
        return

    if message.tier == InboundMessage.Tier.PREMIUM and message.status == InboundMessage.Status.PENDING_PAYMENT:
        return

    message.status = InboundMessage.Status.ANALYZING
    message.save(update_fields=["status", "updated_at"])

    result = analyze_message(message.body, message.subject, message.tier)

    analysis, _ = MessageAnalysis.objects.update_or_create(
        message=message,
        defaults={
            "summary": result.summary,
            "relevance_score": result.relevance_score,
            "opportunity_detected": result.opportunity_detected,
            "opportunity_details": result.opportunity_details,
            "suggested_reply": result.suggested_reply,
            "sentiment": result.sentiment,
            "tags": result.tags,
            "raw_ai_response": result.raw,
        },
    )

    message.status = InboundMessage.Status.ANALYZED
    message.save(update_fields=["status", "updated_at"])

    notify_owner(
        title="Nouveau message analysé",
        body=f"{message.sender_name} — score {analysis.relevance_score}",
        data={"type": "message", "id": message.id},
    )
