from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.bookings.models import AvailabilitySlot


class Command(BaseCommand):
    help = "Crée des créneaux de démonstration pour les 14 prochains jours"

    def handle(self, *args, **options):
        now = timezone.now()
        created = 0
        for day in range(1, 15):
            base = (now + timedelta(days=day)).replace(minute=0, second=0, microsecond=0)
            for hour in (10, 14, 17):
                start = base.replace(hour=hour)
                if start <= now:
                    continue
                end = start + timedelta(minutes=30)
                _, was_created = AvailabilitySlot.objects.get_or_create(
                    start_at=start,
                    defaults={"end_at": end},
                )
                if was_created:
                    created += 1
        self.stdout.write(self.style.SUCCESS(f"{created} créneaux créés."))
