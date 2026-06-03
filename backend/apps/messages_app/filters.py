import django_filters

from .models import InboundMessage


class InboundMessageFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")
    min_relevance = django_filters.NumberFilter(
        field_name="analysis__relevance_score",
        lookup_expr="gte",
    )
    max_relevance = django_filters.NumberFilter(
        field_name="analysis__relevance_score",
        lookup_expr="lte",
    )
    sender_email = django_filters.CharFilter(field_name="sender_email", lookup_expr="iexact")

    class Meta:
        model = InboundMessage
        fields = ["tier", "status", "is_priority", "sender_email"]

    @property
    def qs(self):
        qs = super().qs
        order = (self.request.query_params.get("order") or "").strip()
        if order == "relevance":
            return qs.order_by("-analysis__relevance_score", "-created_at")
        if order == "-relevance":
            return qs.order_by("analysis__relevance_score", "-created_at")
        if order == "date":
            return qs.order_by("created_at")
        if order == "-date":
            return qs.order_by("-created_at")
        return qs
