from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.core.models import PlatformSettings

User = get_user_model()


class Command(BaseCommand):
    help = "Crée le compte Black Pater et les paramètres plateforme"

    def add_arguments(self, parser):
        parser.add_argument("--username", default="BlackPater")
        parser.add_argument("--password", default="changeme")
        parser.add_argument("--email", default="owner@BlackPater.app")

    def handle(self, *args, **options):
        import os

        username = os.getenv("DJANGO_SUPERUSER_USERNAME") or options["username"]
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD") or options["password"]
        email = os.getenv("DJANGO_SUPERUSER_EMAIL") or options["email"]

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "role": User.Role.OWNER,
                "display_name": "Black Pater",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created or os.getenv("DJANGO_SUPERUSER_PASSWORD"):
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Owner configuré: {user.username}"))
        else:
            self.stdout.write(f"Owner existant: {user.username}")

        PlatformSettings.objects.get_or_create(pk=1)
        self.stdout.write(self.style.SUCCESS("PlatformSettings initialisés."))
