from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        OWNER = "owner", "Propriétaire"
        VISITOR = "visitor", "Visiteur"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VISITOR,
    )
    display_name = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    occupation = models.CharField(max_length=200, blank=True)
    avatar_url = models.URLField(blank=True)
    subscription_active_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fin de l'abonnement premium visiteur",
    )

    @property
    def is_black_pater(self) -> bool:
        return self.role == self.Role.OWNER

    def __str__(self) -> str:
        return self.display_name or self.username


class PlatformSettings(models.Model):
    """Configuration publique de la page unique."""
    display_name = models.CharField(max_length=120, default="Black Pater")
    tagline = models.CharField(max_length=255, default="Monétisez chaque minute.")
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    premium_message_price_cents = models.PositiveIntegerField(default=990)
    call_price_cents = models.PositiveIntegerField(default=15000)
    free_messages_per_day = models.PositiveIntegerField(default=50)
    social_links = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Platform settings"

    def __str__(self) -> str:
        return self.display_name
