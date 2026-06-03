from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from django.conf import settings

from .models import DeviceToken, NotificationLog
from .serializers import DeviceTokenSerializer, NotificationLogSerializer


class RegisterDeviceView(APIView):
    def post(self, request):
        token = request.data.get("token")
        platform = request.data.get("platform", "web")
        if not token:
            return Response(
                {"detail": "Token requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        device, _ = DeviceToken.objects.update_or_create(
            token=token,
            defaults={"user": request.user, "platform": platform},
        )
        return Response(DeviceTokenSerializer(device).data)


class FCMConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "vapid_key": settings.FCM_VAPID_KEY,
                "configured": bool(settings.FIREBASE_CREDENTIALS_PATH),
            }
        )


class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationLog.objects.all()[:100]
    serializer_class = NotificationLogSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated and not request.user.is_black_pater:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied()
        return super().dispatch(request, *args, **kwargs)
