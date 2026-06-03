from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import InboundMessage
from .models import OwnerReply
from .serializers import (
    InboundMessageCreateSerializer,
    InboundMessageDetailSerializer,
    InboundMessagePublicSerializer,
    OwnerReplyCreateSerializer,
    OwnerReplySerializer,
    ThreadItemSerializer,
)
from .filters import InboundMessageFilter
from .tasks import analyze_message_task


def _voice_note_url(request, message):
    if not message.voice_note:
        return None
    return request.build_absolute_uri(message.voice_note.url)


class VisitorThreadView(APIView):
    """Historique de conversation pour un visiteur (identifié par email)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        email = (request.query_params.get("email") or "").strip()
        user = request.user
        if user.is_authenticated and getattr(user, "role", None) == "visitor":
            email = (user.email or "").strip()
        if not email:
            return Response({"items": []})

        messages = (
            InboundMessage.objects.filter(sender_email__iexact=email)
            .exclude(status=InboundMessage.Status.PENDING_PAYMENT)
            .prefetch_related("replies")
        )

        events = []
        for message in messages:
            events.append(
                {
                    "kind": "visitor",
                    "id": message.id,
                    "body": message.body,
                    "created_at": message.created_at,
                    "voice_note_url": _voice_note_url(request, message),
                    "is_priority": message.is_priority,
                    "tier": message.tier,
                }
            )
            for reply in message.replies.all():
                events.append(
                    {
                        "kind": "owner",
                        "id": reply.id,
                        "body": reply.body,
                        "created_at": reply.created_at,
                        "voice_note_url": None,
                        "is_priority": False,
                    }
                )

        events.sort(key=lambda item: item["created_at"])
        serializer = ThreadItemSerializer(events, many=True)
        return Response({"items": serializer.data})


class SubmitMessageView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = InboundMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save()

        analyze_message_task.delay(message.id)
        return Response(
            {"message": InboundMessagePublicSerializer(message).data},
            status=status.HTTP_201_CREATED,
        )


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InboundMessageDetailSerializer
    filterset_class = InboundMessageFilter
    search_fields = ["sender_name", "sender_email", "subject", "body"]
    ordering_fields = ["created_at", "is_priority", "analysis__relevance_score"]

    def get_queryset(self):
        qs = (
            InboundMessage.objects.select_related("analysis")
            .prefetch_related("replies")
            .exclude(status=InboundMessage.Status.PENDING_PAYMENT)
        )
        return qs

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated and not request.user.is_black_pater:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Accès réservé à Black Pater.")
        return super().dispatch(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def reanalyze(self, request, pk=None):
        message = self.get_object()
        analyze_message_task.delay(message.id)
        return Response({"detail": "Analyse relancée."})

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        message = self.get_object()
        message.status = InboundMessage.Status.ARCHIVED
        message.save(update_fields=["status", "updated_at"])
        return Response(
            InboundMessageDetailSerializer(message, context={"request": request}).data
        )

    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        message = self.get_object()
        serializer = OwnerReplyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        owner_reply = OwnerReply.objects.create(
            message=message,
            body=serializer.validated_data["body"],
        )
        return Response(
            OwnerReplySerializer(owner_reply).data,
            status=status.HTTP_201_CREATED,
        )
