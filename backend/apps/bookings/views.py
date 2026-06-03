from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.services import create_checkout_for_booking

from .models import AvailabilitySlot, CallBooking
from .serializers import (
    AvailabilitySlotSerializer,
    CallBookingCreateSerializer,
    CallBookingSerializer,
)


class PublicSlotsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        slots = AvailabilitySlot.objects.filter(
            is_booked=False,
            start_at__gte=timezone.now(),
        )[:60]
        return Response(AvailabilitySlotSerializer(slots, many=True).data)


class BookCallView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CallBookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        checkout = create_checkout_for_booking(booking, request)
        return Response(
            {
                "booking": CallBookingSerializer(booking).data,
                "checkout_url": checkout.get("url"),
                "session_id": checkout.get("session_id"),
            },
            status=status.HTTP_201_CREATED,
        )


class BookingViewSet(viewsets.ModelViewSet):
    queryset = CallBooking.objects.select_related("slot").all()
    serializer_class = CallBookingSerializer
    http_method_names = ["get", "patch", "head", "options"]
    filterset_fields = ["status"]

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated and not request.user.is_black_pater:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied()
        return super().dispatch(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        meeting_link = request.data.get("meeting_link")
        new_status = request.data.get("status")
        if meeting_link is not None:
            instance.meeting_link = meeting_link
        if new_status in dict(CallBooking.Status.choices):
            instance.status = new_status
        instance.save()
        return Response(CallBookingSerializer(instance).data)


class SlotManageViewSet(viewsets.ModelViewSet):
    queryset = AvailabilitySlot.objects.all()
    serializer_class = AvailabilitySlotSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated and not request.user.is_black_pater:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied()
        return super().dispatch(request, *args, **kwargs)
