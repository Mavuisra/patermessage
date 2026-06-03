"""Génération du reçu PDF — format maquette « Paiement réussi »."""

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from .models import PaymentRecord
from .subscription import format_money

BLUE = colors.HexColor("#025dcc")
BLUE_LIGHT = colors.HexColor("#e8f1fc")
GRAY = colors.HexColor("#6b7280")
GRAY_DARK = colors.HexColor("#1a1a1a")
BORDER = colors.HexColor("#e5e7eb")
WHITE = colors.white


def _kind_label(payment: PaymentRecord) -> str:
    if payment.kind == PaymentRecord.Kind.SUBSCRIPTION:
        return "Abonnement mensuel premium"
    if payment.kind == PaymentRecord.Kind.CALL_BOOKING:
        return "Réservation appel"
    return "Message prioritaire"


def _txn_id(payment: PaymentRecord) -> str:
    if payment.receipt_number:
        return payment.receipt_number.replace("-", "").upper()[:12]
    if payment.stripe_payment_intent_id:
        return payment.stripe_payment_intent_id[-12:].upper()
    return f"TXN{payment.id:08X}"[:12]


def _paid_date_line(payment: PaymentRecord) -> str:
    dt = payment.paid_at or payment.created_at
    months = (
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre",
    )
    return f"{dt.day} {months[dt.month - 1]} {dt.year} • {dt.strftime('%H:%M')}"


def _payment_method(payment: PaymentRecord) -> str:
    method = (payment.metadata or {}).get("payment_method")
    if method:
        return str(method)
    return "Carte / Mobile Money"


def generate_receipt_pdf(payment: PaymentRecord) -> bytes:
    buffer = BytesIO()
    page_w, page_h = A4
    c = canvas.Canvas(buffer, pagesize=A4)

    card_w = 170 * mm
    card_h = 220 * mm
    card_x = (page_w - card_w) / 2
    card_y = page_h - 50 * mm - card_h

    # Fond page
    c.setFillColor(colors.HexColor("#f0f2f5"))
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # Carte blanche
    c.setFillColor(WHITE)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.roundRect(card_x, card_y, card_w, card_h, 12, fill=1, stroke=1)

    cx = card_x + card_w / 2
    y = card_y + card_h - 28 * mm

    # Cercle succès
    r = 14 * mm
    c.setFillColor(BLUE)
    c.circle(cx, y, r, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(cx, y - 7, "✓")

    y -= 22 * mm
    c.setFillColor(GRAY_DARK)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(cx, y, "Paiement réussi !")

    y -= 10 * mm
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 10)
    subtitle = (
        "Votre abonnement est actif. Messages prioritaires "
        "et vocaux débloqués."
        if payment.kind == PaymentRecord.Kind.SUBSCRIPTION
        else "Votre message a été envoyé en priorité et notifié à Black Pater."
    )
    for i, line in enumerate(_wrap_text(subtitle, 52)):
        c.drawCentredString(cx, y - i * 12, line)
    y -= 8 * mm + (len(_wrap_text(subtitle, 52)) - 1) * 12

    # Boîte récapitulatif
    box_x = card_x + 10 * mm
    box_w = card_w - 20 * mm
    box_h = 72 * mm
    box_y = y - box_h

    c.setFillColor(colors.HexColor("#fafafa"))
    c.setStrokeColor(BORDER)
    c.roundRect(box_x, box_y, box_w, box_h, 8, fill=1, stroke=1)

    ty = box_y + box_h - 8 * mm
    c.setFillColor(GRAY)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(box_x + 6 * mm, ty, "RÉCAPITULATIF")

    ty -= 10 * mm
    # Ligne Black Pater + montant
    c.setFillColor(GRAY_DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(box_x + 6 * mm, ty, "Black Pater")
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(box_x + 48 * mm, ty + 1, "✓")

    amount = format_money(payment.amount_cents, payment.currency)
    c.setFillColor(GRAY_DARK)
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(box_x + box_w - 6 * mm, ty, amount)

    ty -= 5 * mm
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 9)
    c.drawString(box_x + 6 * mm, ty, _kind_label(payment))

    ty -= 9 * mm
    _draw_row(c, box_x, box_w, ty, "Méthode de paiement", _payment_method(payment))
    ty -= 8 * mm
    _draw_row(c, box_x, box_w, ty, "Date", _paid_date_line(payment))
    ty -= 8 * mm
    _draw_row(c, box_x, box_w, ty, "ID de transaction", _txn_id(payment))

    y = box_y - 10 * mm

    # Encadré sécurité
    sec_h = 22 * mm
    sec_y = y - sec_h
    c.setFillColor(BLUE_LIGHT)
    c.setStrokeColor(colors.HexColor("#c5daf5"))
    c.roundRect(box_x, sec_y, box_w, sec_h, 8, fill=1, stroke=1)

    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(box_x + 6 * mm, sec_y + sec_h - 9 * mm, "Transaction sécurisée")

    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    c.drawString(
        box_x + 6 * mm,
        sec_y + 5 * mm,
        "Votre paiement est 100% sécurisé. Merci pour votre confiance.",
    )

    # Pied de page
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    c.drawCentredString(
        cx,
        card_y + 8 * mm,
        f"Client : {payment.customer_name or '—'} · {payment.customer_email}",
    )

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def _wrap_text(text: str, max_chars: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current: list[str] = []
    for w in words:
        trial = " ".join(current + [w])
        if len(trial) <= max_chars:
            current.append(w)
        else:
            if current:
                lines.append(" ".join(current))
            current = [w]
    if current:
        lines.append(" ".join(current))
    return lines or [text]


def _draw_row(c, box_x, box_w, y, label: str, value: str):
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    c.drawString(box_x + 6 * mm, y, label)
    c.setFillColor(GRAY_DARK)
    c.setFont("Helvetica", 9)
    c.drawRightString(box_x + box_w - 6 * mm, y, value)
