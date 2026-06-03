from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MessageViewSet, SubmitMessageView, VisitorThreadView

router = DefaultRouter()
router.register("", MessageViewSet, basename="messages")

reply_view = MessageViewSet.as_view({"post": "reply"})

urlpatterns = [
    path("thread/", VisitorThreadView.as_view(), name="visitor-thread"),
    path("submit/", SubmitMessageView.as_view(), name="submit-message"),
    path("<int:pk>/reply/", reply_view, name="messages-reply"),
    path("", include(router.urls)),
]
