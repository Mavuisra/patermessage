import logging
from typing import Any

import stripe
from django.conf import settings
from django.utils import timezone

from apps.bookings.models import AvailabilitySlot, CallBooking
from apps.messages_app.models import InboundMessage
from apps.messages_app.tasks import analyze_message_task
from apps.notifications.services import notify_owner

from .models import PaymentRecord

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY


def _frontend_base(request) -> str:
    origin = request.META.get("HTTP_ORIGIN") or "http://localhost:5173"
    return origin.rstrip("/")


def _mock_checkout(amount_cents: int, label: str, metadata: dict) -> dict:
    """Mode démo sans clé Stripe."""
    return {
        "url": None,
        "session_id": f"mock_{metadata.get('kind')}_{metadata.get('ref_id')}",
        "mock": True,
        "amount_cents": amount_cents,
        "label": label,
    }


def create_checkout_for_message(message: InboundMessage, request) -> dict[str, Any]:
    base = _frontend_base(request)
    payment = PaymentRecord.objects.create(
        kind=PaymentRecord.Kind.PREMIUM_MESSAGE,
        amount_cents=message.amount_cents,
        customer_email=message.sender_email,
        customer_name=message.sender_name,
        reference_id=message.id,
        metadata={"message_id": message.id},
    )

    if not settings.STRIPE_SECRET_KEY:
        return _mock_checkout(
            message.amount_cents,
            "Message premium",
            {"kind": "message", "ref_id": message.id, "payment_id": payment.id},
        )

    session = stripe.checkout.Session.create(
        mode="payment",
        customer_email=message.sender_email,
        line_items=[
            {
                "price_data": {
                    "currency": settings.SUBSCRIPTION_CURRENCY,
                    "unit_amount": message.amount_cents,
                    "product_data": {"name": "Message premium — Black Pater"},
                },
                "quantity": 1,
            }
        ],
        success_url=f"{base}/payment/success?message={message.id}",
        cancel_url=f"{base}/chat?payment=cancelled",
        metadata={
            "payment_id": str(payment.id),
            "message_id": str(message.id),
            "kind": PaymentRecord.Kind.PREMIUM_MESSAGE,
        },
    )
    payment.stripe_session_id = session.id
    payment.save(update_fields=["stripe_session_id"])
    return {"url": session.url, "session_id": session.id}


def create_checkout_for_booking(booking: CallBooking, request) -> dict[str, Any]:
    base = _frontend_base(request)
    payment = PaymentRecord.objects.create(
        kind=PaymentRecord.Kind.CALL_BOOKING,
        amount_cents=booking.amount_cents,
        customer_email=booking.guest_email,
        customer_name=booking.guest_name,
        reference_id=booking.id,
        metadata={"booking_id": booking.id},
    )

    if not settings.STRIPE_SECRET_KEY:
        return _mock_checkout(
            booking.amount_cents,
            "Réservation appel",
            {"kind": "booking", "ref_id": booking.id, "payment_id": payment.id},
        )

    session = stripe.checkout.Session.create(
        mode="payment",
        customer_email=booking.guest_email,
        line_items=[
            {
                "price_data": {
                    "currency": settings.SUBSCRIPTION_CURRENCY,
                    "unit_amount": booking.amount_cents,
                    "product_data": {"name": "Appel privé — Black Pater"},
                },
                "quantity": 1,
            }
        ],
        success_url=f"{base}/call?payment=success&booking={booking.id}",
        cancel_url=f"{base}/call?payment=cancelled",
        metadata={
            "payment_id": str(payment.id),
            "booking_id": str(booking.id),
            "kind": PaymentRecord.Kind.CALL_BOOKING,
        },
    )
    payment.stripe_session_id = session.id
    payment.save(update_fields=["stripe_session_id"])
    return {"url": session.url, "session_id": session.id}


def fulfill_payment(payment: PaymentRecord):
    from django.contrib.auth import get_user_model

    from .subscription import attach_receipt_pdf, extend_subscription

    payment.status = PaymentRecord.Status.SUCCEEDED
    payment.paid_at = timezone.now()
    payment.save()

    if payment.kind == PaymentRecord.Kind.SUBSCRIPTION:
        User = get_user_model()
        try:
            user = User.objects.get(pk=payment.reference_id, role=User.Role.VISITOR)
            extend_subscription(user, payment)
            attach_receipt_pdf(payment)
        except User.DoesNotExist:
            logger.error("Visitor user %s not found", payment.reference_id)

    elif payment.kind == PaymentRecord.Kind.PREMIUM_MESSAGE:
        try:
            message = InboundMessage.objects.get(pk=payment.reference_id)
            message.status = InboundMessage.Status.PAID
            message.save(update_fields=["status", "updated_at"])
            analyze_message_task.delay(message.id)
        except InboundMessage.DoesNotExist:
            logger.error("Message %s not found", payment.reference_id)

    elif payment.kind == PaymentRecord.Kind.CALL_BOOKING:
        try:
            booking = CallBooking.objects.select_related("slot").get(
                pk=payment.reference_id
            )
            booking.status = CallBooking.Status.CONFIRMED
            booking.save(update_fields=["status", "updated_at"])
            slot = booking.slot
            slot.is_booked = True
            slot.save(update_fields=["is_booked"])
            notify_owner(
                title="Nouvel appel réservé",
                body=f"{booking.guest_name} — {slot.start_at}",
                data={"type": "booking", "id": booking.id},
            )
        except CallBooking.DoesNotExist:
            logger.error("Booking %s not found", payment.reference_id)


def handle_stripe_webhook(payload: bytes, sig_header: str):
    if not settings.STRIPE_WEBHOOK_SECRET:
        return None
    event = stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        payment_id = session.get("metadata", {}).get("payment_id")
        if payment_id:
            try:
                payment = PaymentRecord.objects.get(pk=int(payment_id))
                payment.stripe_payment_intent_id = session.get("payment_intent", "")
                fulfill_payment(payment)
            except PaymentRecord.DoesNotExist:
                pass
    return event
