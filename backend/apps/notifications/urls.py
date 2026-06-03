from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FCMConfigView, NotificationLogViewSet, RegisterDeviceView

router = DefaultRouter()
router.register("logs", NotificationLogViewSet, basename="notification-logs")

urlpatterns = [
    path("register/", RegisterDeviceView.as_view(), name="register-device"),
    path("config/", FCMConfigView.as_view(), name="fcm-config"),
    path("", include(router.urls)),
]
