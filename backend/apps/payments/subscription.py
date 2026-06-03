from datetime import timedelta
from io import BytesIO

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils import timezone

from .models import PaymentRecord

User = get_user_model()


def subscription_price_cents() -> int:
    return settings.SUBSCRIPTION_PRICE_CENTS


def subscription_currency() -> str:
    return settings.SUBSCRIPTION_CURRENCY


def format_money(cents: int, currency: str | None = None) -> str:
    cur = (currency or subscription_currency()).upper()
    amount = cents / 100
    if cur == "USD":
        return f"${amount:.2f}"
    return f"{amount:.2f} {cur}"


def get_visitor_user(email: str):
    return User.objects.filter(
        email__iexact=email.strip(),
        role=User.Role.VISITOR,
    ).first()


def subscription_is_active(user) -> bool:
    until = getattr(user, "subscription_active_until", None)
    return bool(until and until > timezone.now())


def subscription_is_active_for_email(email: str) -> bool:
    user = get_visitor_user(email)
    return bool(user and subscription_is_active(user))


def extend_subscription(user, payment: PaymentRecord):
    now = timezone.now()
    base = user.subscription_active_until if subscription_is_active(user) else now
    if base < now:
        base = now
    period_start = base if subscription_is_active(user) else now
    period_end = base + timedelta(days=30)
    user.subscription_active_until = period_end
    user.save(update_fields=["subscription_active_until"])
    payment.period_start = period_start
    payment.period_end = period_end
    payment.save(update_fields=["period_start", "period_end"])


def next_receipt_number() -> str:
    year = timezone.now().year
    prefix = f"BP-{year}-"
    last = (
        PaymentRecord.objects.filter(receipt_number__startswith=prefix)
        .order_by("-id")
        .first()
    )
    seq = 1
    if last and last.receipt_number:
        try:
            seq = int(last.receipt_number.split("-")[-1]) + 1
        except ValueError:
            seq = last.id + 1
    return f"{prefix}{seq:05d}"


def generate_receipt_pdf(payment: PaymentRecord) -> bytes:
    from .receipt_pdf import generate_receipt_pdf as _build

    return _build(payment)


def attach_receipt_pdf(payment: PaymentRecord):
    if not payment.receipt_number:
        payment.receipt_number = next_receipt_number()
    pdf_bytes = generate_receipt_pdf(payment)
    name = f"receipt_{payment.receipt_number}.pdf"
    payment.receipt_pdf.save(name, ContentFile(pdf_bytes), save=False)
    payment.save(update_fields=["receipt_number", "receipt_pdf"])
