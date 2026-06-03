from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MockConfirmPaymentView,
    PaymentHistoryViewSet,
    PaymentReceiptView,
    SubscriptionCheckoutView,
    SubscriptionStatusView,
    VisitorPaymentsView,
    stripe_webhook,
)

router = DefaultRouter()
router.register("history", PaymentHistoryViewSet, basename="payment-history")

urlpatterns = [
    path("subscription/status/", SubscriptionStatusView.as_view(), name="subscription-status"),
    path(
        "subscription/checkout/",
        SubscriptionCheckoutView.as_view(),
        name="subscription-checkout",
    ),
    path("<int:pk>/receipt.pdf", PaymentReceiptView.as_view(), name="payment-receipt"),
    path("my/", VisitorPaymentsView.as_view(), name="visitor-payments"),
    path("webhook/stripe/", stripe_webhook, name="stripe-webhook"),
    path("mock-confirm/", MockConfirmPaymentView.as_view(), name="mock-confirm"),
    path("", include(router.urls)),
]
