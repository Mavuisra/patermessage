from rest_framework import serializers

from .models import InboundMessage, MessageAnalysis, OwnerReply


class MessageAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageAnalysis
        fields = (
            "summary",
            "relevance_score",
            "opportunity_detected",
            "opportunity_details",
            "suggested_reply",
            "sentiment",
            "tags",
            "analyzed_at",
        )


class InboundMessagePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = InboundMessage
        fields = ("id", "tier", "status", "created_at")


class ThreadItemSerializer(serializers.Serializer):
    kind = serializers.CharField()
    id = serializers.IntegerField()
    body = serializers.CharField()
    created_at = serializers.DateTimeField()
    voice_note_url = serializers.CharField(allow_null=True, required=False)
    is_priority = serializers.BooleanField(required=False)
    tier = serializers.CharField(required=False)


class InboundMessageCreateSerializer(serializers.ModelSerializer):
    tier = serializers.ChoiceField(
        choices=InboundMessage.Tier.choices,
        default=InboundMessage.Tier.FREE,
    )

    class Meta:
        model = InboundMessage
        fields = (
            "sender_name",
            "sender_email",
            "sender_phone",
            "sender_occupation",
            "subject",
            "body",
            "tier",
            "voice_note",
        )

    def validate(self, attrs):
        body = (attrs.get("body") or "").strip()
        voice = attrs.get("voice_note")
        if not body and not voice:
            raise serializers.ValidationError(
                "Un message texte ou un enregistrement vocal est requis."
            )
        if not body and voice:
            attrs["body"] = "Message vocal"
        else:
            attrs["body"] = body
        return attrs

    def create(self, validated_data):
        tier = validated_data["tier"]
        from django.conf import settings as django_settings

        amount = 0
        status = InboundMessage.Status.ANALYZING
        is_priority = False

        if tier == InboundMessage.Tier.PREMIUM:
            from apps.payments.subscription import subscription_is_active_for_email

            email = validated_data.get("sender_email", "")
            if not subscription_is_active_for_email(email):
                raise serializers.ValidationError(
                    {"tier": "Abonnement actif requis (9,90 $/mois)."}
                )
            amount = django_settings.SUBSCRIPTION_PRICE_CENTS
            status = InboundMessage.Status.ANALYZING
            is_priority = True

        return InboundMessage.objects.create(
            **validated_data,
            amount_cents=amount,
            status=status,
            is_priority=is_priority,
        )


class OwnerReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerReply
        fields = ("id", "body", "created_at")


class OwnerReplyCreateSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=5000, trim_whitespace=True)


class InboundMessageDetailSerializer(serializers.ModelSerializer):
    analysis = MessageAnalysisSerializer(read_only=True)
    voice_note_url = serializers.SerializerMethodField()
    replies = OwnerReplySerializer(many=True, read_only=True)

    class Meta:
        model = InboundMessage
        fields = (
            "id",
            "sender_name",
            "sender_email",
            "sender_phone",
            "sender_occupation",
            "subject",
            "body",
            "voice_note_url",
            "tier",
            "status",
            "is_priority",
            "amount_cents",
            "created_at",
            "updated_at",
            "analysis",
            "replies",
        )

    def get_voice_note_url(self, obj):
        if not obj.voice_note:
            return None
        request = self.context.get("request")
        url = obj.voice_note.url
        if request:
            return request.build_absolute_uri(url)
        return url
