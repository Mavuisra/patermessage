from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PlatformSettings
from .models import User
from .serializers import (
    LoginSerializer,
    PlatformPublicSerializer,
    UserSerializer,
    VisitorLoginSerializer,
    VisitorProfileUpdateSerializer,
    VisitorRegisterSerializer,
)


def _auth_response(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    }


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


class PublicProfileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings_obj, _ = PlatformSettings.objects.get_or_create(
            pk=1,
            defaults={
                "display_name": settings.BLACK_PANTHER_DISPLAY_NAME,
                "tagline": settings.BLACK_PANTHER_TAGLINE,
                "premium_message_price_cents": settings.PREMIUM_MESSAGE_PRICE_CENTS,
                "call_price_cents": settings.CALL_BOOKING_PRICE_CENTS,
            },
        )
        return Response(PlatformPublicSerializer(settings_obj).data)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from django.contrib.auth import authenticate

        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not user or user.role != user.Role.OWNER:
            return Response(
                {"detail": "Identifiants invalides."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(_auth_response(user))


class VisitorRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VisitorRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        email = data["email"].strip().lower()
        user = User.objects.create_user(
            username=email,
            email=email,
            password=data["password"],
            role=User.Role.VISITOR,
            display_name=data["name"].strip(),
            phone=(data.get("phone") or "").strip(),
            occupation=data["occupation"].strip(),
        )
        return Response(_auth_response(user), status=status.HTTP_201_CREATED)


class VisitorLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VisitorLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from django.contrib.auth import authenticate

        email = serializer.validated_data["email"].strip().lower()
        password = serializer.validated_data["password"]
        account = User.objects.filter(email__iexact=email, role=User.Role.VISITOR).first()
        if not account:
            return Response(
                {"detail": "Email ou mot de passe incorrect."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user = authenticate(username=account.username, password=password)
        if not user:
            return Response(
                {"detail": "Email ou mot de passe incorrect."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(_auth_response(user))


class VisitorMeView(APIView):
    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get(self, request):
        if request.user.role != User.Role.VISITOR:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        if request.user.role != User.Role.VISITOR:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        serializer = VisitorProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user
        if "name" in data:
            user.display_name = data["name"].strip()
        if "phone" in data:
            user.phone = (data["phone"] or "").strip()
        if "occupation" in data:
            user.occupation = data["occupation"].strip()
        user.save(
            update_fields=["display_name", "phone", "occupation"],
        )
        return Response(UserSerializer(user).data)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)
