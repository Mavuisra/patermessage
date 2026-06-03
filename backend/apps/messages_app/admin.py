from django.contrib import admin

from .models import InboundMessage, MessageAnalysis


class MessageAnalysisInline(admin.StackedInline):
    model = MessageAnalysis
    extra = 0


@admin.register(InboundMessage)
class InboundMessageAdmin(admin.ModelAdmin):
    list_display = ("sender_name", "tier", "status", "is_priority", "created_at")
    list_filter = ("tier", "status", "is_priority")
    search_fields = ("sender_name", "sender_email", "subject")
    inlines = [MessageAnalysisInline]
