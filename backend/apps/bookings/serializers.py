from rest_framework import serializers

from .models import AvailabilitySlot, CallBooking


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilitySlot
        fields = ("id", "start_at", "end_at", "is_booked")


class CallBookingCreateSerializer(serializers.ModelSerializer):
    slot_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CallBooking
        fields = ("slot_id", "guest_name", "guest_email", "topic", "notes")

    def validate_slot_id(self, value):
        try:
            slot = AvailabilitySlot.objects.get(pk=value, is_booked=False)
        except AvailabilitySlot.DoesNotExist:
            raise serializers.ValidationError("Créneau indisponible.")
        self.context["slot"] = slot
        return value

    def create(self, validated_data):
        slot = self.context["slot"]
        from django.conf import settings as django_settings

        validated_data.pop("slot_id")
        return CallBooking.objects.create(
            slot=slot,
            amount_cents=django_settings.CALL_BOOKING_PRICE_CENTS,
            **validated_data,
        )


class CallBookingSerializer(serializers.ModelSerializer):
    slot = AvailabilitySlotSerializer(read_only=True)

    class Meta:
        model = CallBooking
        fields = (
            "id",
            "slot",
            "guest_name",
            "guest_email",
            "topic",
            "notes",
            "status",
            "amount_cents",
            "meeting_link",
            "created_at",
            "updated_at",
        )
