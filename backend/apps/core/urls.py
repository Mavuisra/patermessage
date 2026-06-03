from django.urls import path

from .owner_views import OwnerDeleteVisitorView
from .views import (
    HealthView,
    LoginView,
    MeView,
    PublicProfileView,
    VisitorLoginView,
    VisitorMeView,
    VisitorRegisterView,
)

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("public/", PublicProfileView.as_view(), name="public-profile"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/visitor/register/", VisitorRegisterView.as_view(), name="visitor-register"),
    path("auth/visitor/login/", VisitorLoginView.as_view(), name="visitor-login"),
    path("auth/visitor/me/", VisitorMeView.as_view(), name="visitor-me"),
    path("owner/visitors/", OwnerDeleteVisitorView.as_view(), name="owner-delete-visitor"),
]
