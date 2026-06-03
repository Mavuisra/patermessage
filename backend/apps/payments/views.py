from django.http import FileResponse, Http404, HttpResponse
from django.utils.encoding import iri_to_uri
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.core.models import User

from .models import PaymentRecord
from .serializers import PaymentRecordSerializer
from .services import fulfill_payment, handle_stripe_webhook
from .subscription import generate_receipt_pdf
from .subscription_checkout import (
    create_subscription_checkout,
    subscription_status_payload,
)


class SubscriptionStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        email = (request.query_params.get("email") or "").strip()
        if user and getattr(user, "role", None) == User.Role.VISITOR:
            email = user.email
        return Response(subscription_status_payload(user, email))


class SubscriptionCheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != User.Role.VISITOR:
            return Response({"detail": "Compte visiteur requis."}, status=403)
        try:
            result = create_subscription_checkout(request.user, request)
            return Response(result)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class PaymentReceiptView(APIView):
    """Affiche le reçu PDF dans le navigateur (email en query ou JWT visiteur)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = [JWTAuthentication]

    def finalize_response(self, request, response, *args, **kwargs):
        if isinstance(response, (FileResponse, HttpResponse)):
            return response
        return super().finalize_response(request, response, *args, **kwargs)

    def get(self, request, pk: int):
        try:
            payment = PaymentRecord.objects.get(pk=pk)
        except PaymentRecord.DoesNotExist as exc:
            raise Http404 from exc

        if payment.status != PaymentRecord.Status.SUCCEEDED:
            raise Http404

        user = request.user
        email = (request.query_params.get("email") or "").strip().lower()
        allowed = False
        if user.is_authenticated and getattr(user, "role", None) == User.Role.VISITOR:
            allowed = payment.customer_email.lower() == (user.email or "").lower()
        elif email:
            allowed = payment.customer_email.lower() == email
        if not allowed:
            return HttpResponse(
                "Accès refusé. Ouvrez le reçu depuis l'onglet Paiements.",
                status=403,
                content_type="text/plain; charset=utf-8",
            )

        filename = f"{payment.receipt_number or f'receipt-{payment.id}'}.pdf"

        from .subscription import attach_receipt_pdf

        attach_receipt_pdf(payment)
        payment.refresh_from_db()

        if payment.receipt_pdf:
            try:
                pdf_file = payment.receipt_pdf.open("rb")
                response = FileResponse(
                    pdf_file,
                    content_type="application/pdf",
                    as_attachment=False,
                    filename=filename,
                )
            except OSError:
                pdf_bytes = generate_receipt_pdf(payment)
                response = HttpResponse(pdf_bytes, content_type="application/pdf")
        else:
            pdf_bytes = generate_receipt_pdf(payment)
            response = HttpResponse(pdf_bytes, content_type="application/pdf")

        response["Content-Disposition"] = (
            f'inline; filename="{iri_to_uri(filename)}"'
        )
        return response


class VisitorPaymentsView(APIView):
    """Historique des paiements d'un visiteur (par email)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        email = (request.query_params.get("email") or "").strip()
        user = request.user
        if user.is_authenticated and getattr(user, "role", None) == "visitor":
            email = (user.email or "").strip()
        if not email:
            return Response({"items": []})
        payments = PaymentRecord.objects.filter(
            customer_email__iexact=email
        ).order_by("-created_at")[:30]
        serializer = PaymentRecordSerializer(
            payments, many=True, context={"request": request}
        )
        return Response({"items": serializer.data})


class PaymentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaymentRecord.objects.all()
    serializer_class = PaymentRecordSerializer
    filterset_fields = ["kind", "status"]

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated and not request.user.is_black_pater:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied()
        return super().dispatch(request, *args, **kwargs)


class MockConfirmPaymentView(APIView):
    """Confirme un paiement mock en développement (sans Stripe)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payment_id = request.data.get("payment_id")
        message_id = request.data.get("message_id")
        booking_id = request.data.get("booking_id")

        if payment_id:
            try:
                payment = PaymentRecord.objects.get(pk=payment_id)
                fulfill_payment(payment)
                return Response(PaymentRecordSerializer(payment).data)
            except PaymentRecord.DoesNotExist:
                pass

        if message_id:
            payment = (
                PaymentRecord.objects.filter(
                    reference_id=message_id,
                    kind=PaymentRecord.Kind.PREMIUM_MESSAGE,
                )
                .order_by("-created_at")
                .first()
            )
            if payment:
                fulfill_payment(payment)
                return Response({"detail": "Message premium activé."})

        if booking_id:
            payment = (
                PaymentRecord.objects.filter(
                    reference_id=booking_id,
                    kind=PaymentRecord.Kind.CALL_BOOKING,
                )
                .order_by("-created_at")
                .first()
            )
            if payment:
                fulfill_payment(payment)
                return Response({"detail": "Réservation confirmée."})

        return Response(
            {"detail": "Paiement introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )


@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def stripe_webhook(request):
    sig = request.META.get("HTTP_STRIPE_SIGNATURE", "")
    try:
        handle_stripe_webhook(request.body, sig)
    except Exception as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"received": True})
