from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.messages_app.models import InboundMessage
from apps.payments.models import PaymentRecord

User = get_user_model()


def _require_owner(request):
    if not request.user.is_authenticated or not request.user.is_black_pater:
        return False
    return True


class OwnerDeleteVisitorView(APIView):
    """Supprime un visiteur et toutes ses données (messages, paiements, compte)."""

    def delete(self, request):
        if not _require_owner(request):
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        email = (request.query_params.get("email") or request.data.get("email") or "").strip()
        if not email:
            return Response(
                {"detail": "Email requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        messages_qs = InboundMessage.objects.filter(sender_email__iexact=email)
        payments_qs = PaymentRecord.objects.filter(customer_email__iexact=email)
        users_qs = User.objects.filter(email__iexact=email, role=User.Role.VISITOR)

        deleted = {
            "messages": messages_qs.count(),
            "payments": payments_qs.count(),
            "accounts": users_qs.count(),
        }
        messages_qs.delete()
        payments_qs.delete()
        users_qs.delete()

        return Response(
            {
                "detail": "Visiteur supprimé.",
                "email": email,
                "deleted": deleted,
            }
        )
