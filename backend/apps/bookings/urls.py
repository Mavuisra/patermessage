from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BookCallView, BookingViewSet, PublicSlotsView, SlotManageViewSet

router = DefaultRouter()
router.register("manage", BookingViewSet, basename="bookings-manage")
router.register("slots/manage", SlotManageViewSet, basename="slots-manage")

urlpatterns = [
    path("slots/", PublicSlotsView.as_view(), name="public-slots"),
    path("book/", BookCallView.as_view(), name="book-call"),
    path("", include(router.urls)),
]
