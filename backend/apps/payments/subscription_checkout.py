from typing import Any

import stripe
from django.conf import settings

from apps.core.models import User

from .models import PaymentRecord
from .services import _frontend_base, _mock_checkout
from .subscription import (
    extend_subscription,
    format_money,
    get_visitor_user,
    subscription_currency,
    subscription_is_active,
    subscription_price_cents,
)

stripe.api_key = settings.STRIPE_SECRET_KEY


def create_subscription_checkout(user: User, request) -> dict[str, Any]:
    if user.role != User.Role.VISITOR:
        raise ValueError("Compte visiteur requis.")

    if subscription_is_active(user):
        raise ValueError("Votre abonnement est déjà actif.")

    amount = subscription_price_cents()
    currency = subscription_currency()
    base = _frontend_base(request)

    payment = PaymentRecord.objects.create(
        kind=PaymentRecord.Kind.SUBSCRIPTION,
        amount_cents=amount,
        currency=currency,
        customer_email=user.email,
        customer_name=user.display_name or user.username,
        reference_id=user.id,
        metadata={"user_id": user.id},
    )

    if not settings.STRIPE_SECRET_KEY:
        mock = _mock_checkout(
            amount,
            "Abonnement Black Pater",
            {"kind": "subscription", "ref_id": user.id, "payment_id": payment.id},
        )
        return {**mock, "payment_id": payment.id}

    session = stripe.checkout.Session.create(
        mode="payment",
        customer_email=user.email,
        line_items=[
            {
                "price_data": {
                    "currency": currency,
                    "unit_amount": amount,
                    "product_data": {
                        "name": "Black Pater — Abonnement mensuel",
                        "description": "Messages prioritaires et vocaux — 1 mois",
                    },
                },
                "quantity": 1,
            }
        ],
        success_url=f"{base}/payment/success?subscription=1&payment={payment.id}",
        cancel_url=f"{base}/payments?payment=cancelled",
        metadata={
            "payment_id": str(payment.id),
            "user_id": str(user.id),
            "kind": PaymentRecord.Kind.SUBSCRIPTION,
        },
    )
    payment.stripe_session_id = session.id
    payment.save(update_fields=["stripe_session_id"])
    return {"url": session.url, "session_id": session.id, "payment_id": payment.id}


def subscription_status_payload(user: User | None, email: str = "") -> dict:
    visitor = user
    if not visitor and email:
        visitor = get_visitor_user(email)

    amount = subscription_price_cents()
    currency = subscription_currency()
    active = bool(visitor and subscription_is_active(visitor))
    until = None
    if visitor and visitor.subscription_active_until:
        until = visitor.subscription_active_until.isoformat()

    return {
        "active": active,
        "active_until": until,
        "can_subscribe": bool(visitor) and not active,
        "price_cents": amount,
        "currency": currency,
        "price_display": format_money(amount, currency),
        "label": "$9.90 / month",
    }
