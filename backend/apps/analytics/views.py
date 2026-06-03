from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import CallBooking
from apps.messages_app.models import InboundMessage, MessageAnalysis
from apps.payments.models import PaymentRecord


class DashboardStatsView(APIView):
    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get(self, request):
        if not request.user.is_black_panther:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied()

        now = timezone.now()
        thirty_days_ago = now - timezone.timedelta(days=30)

        messages = InboundMessage.objects.filter(created_at__gte=thirty_days_ago)
        payments = PaymentRecord.objects.filter(
            status=PaymentRecord.Status.SUCCEEDED,
            created_at__gte=thirty_days_ago,
        )
        bookings = CallBooking.objects.filter(created_at__gte=thirty_days_ago)

        revenue_cents = payments.aggregate(total=Sum("amount_cents"))["total"] or 0
        avg_score = MessageAnalysis.objects.aggregate(avg=Avg("relevance_score"))[
            "avg"
        ] or 0

        messages_by_day = (
            messages.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        revenue_by_day = (
            payments.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Sum("amount_cents"))
            .order_by("day")
        )

        return Response(
            {
                "period_days": 30,
                "totals": {
                    "messages": messages.count(),
                    "free_messages": messages.filter(tier="free").count(),
                    "premium_messages": messages.filter(tier="premium").count(),
                    "opportunities": MessageAnalysis.objects.filter(
                        opportunity_detected=True
                    ).count(),
                    "bookings": bookings.filter(
                        status=CallBooking.Status.CONFIRMED
                    ).count(),
                    "revenue_cents": revenue_cents,
                    "revenue_display": f"${revenue_cents / 100:.2f}",
                    "avg_relevance_score": round(avg_score, 1),
                },
                "charts": {
                    "messages_by_day": list(messages_by_day),
                    "revenue_by_day": list(revenue_by_day),
                },
                "recent_high_value": list(
                    MessageAnalysis.objects.filter(relevance_score__gte=70)
                    .select_related("message")
                    .order_by("-analyzed_at")[:5]
                    .values(
                        "relevance_score",
                        "summary",
                        "message__sender_name",
                        "message__id",
                    )
                ),
            }
        )
