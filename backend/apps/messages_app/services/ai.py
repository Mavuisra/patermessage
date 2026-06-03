import json
import logging
import re
from dataclasses import dataclass

from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    summary: str
    relevance_score: float
    opportunity_detected: bool
    opportunity_details: str
    suggested_reply: str
    sentiment: str
    tags: list[str]
    raw: dict


def _heuristic_analysis(body: str, subject: str, tier: str) -> AnalysisResult:
    text = f"{subject} {body}".lower()
    score = 35.0
    tags: list[str] = []
    opportunity = False
    opportunity_details = ""

    high_value_keywords = [
        "partenariat",
        "sponsor",
        "investissement",
        "collaboration",
        "media",
        "interview",
        "contrat",
        "budget",
        "urgent",
    ]
    for kw in high_value_keywords:
        if kw in text:
            score += 12
            tags.append(kw)
            opportunity = True
            opportunity_details = f"Signal détecté: «{kw}»"

    if len(body) > 200:
        score += 8
    if tier == "premium":
        score = min(100, score + 20)

    score = min(100.0, max(0.0, score))
    summary = body[:280] + ("…" if len(body) > 280 else "")

    sentiment = "neutre"
    if any(w in text for w in ["merci", "excellent", "génial"]):
        sentiment = "positif"
    elif any(w in text for w in ["problème", "déçu", "plainte"]):
        sentiment = "négatif"

    suggested = (
        "Merci pour votre message. Je reviens vers vous sous 48h ouvrées "
        "avec une réponse personnalisée."
    )
    if opportunity:
        suggested = (
            "Merci pour cette opportunité. Votre proposition semble alignée — "
            "pouvez-vous préciser le calendrier et le périmètre ?"
        )

    return AnalysisResult(
        summary=summary,
        relevance_score=round(score, 1),
        opportunity_detected=opportunity,
        opportunity_details=opportunity_details,
        suggested_reply=suggested,
        sentiment=sentiment,
        tags=tags[:8],
        raw={"provider": "heuristic"},
    )


def _openai_analysis(body: str, subject: str, tier: str) -> AnalysisResult | None:
    if not settings.OPENAI_API_KEY:
        return None
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = f"""Analyse ce message reçu par une personnalité publique (tier: {tier}).

Sujet: {subject}
Message: {body}

Réponds UNIQUEMENT en JSON valide avec ces clés:
summary (fr, 2 phrases), relevance_score (0-100), opportunity_detected (bool),
opportunity_details (fr), suggested_reply (fr, professionnel),
sentiment (positif|neutre|négatif), tags (array de strings max 6)."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        content = response.choices[0].message.content or ""
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if not match:
            return None
        data = json.loads(match.group())
        return AnalysisResult(
            summary=data.get("summary", ""),
            relevance_score=float(data.get("relevance_score", 50)),
            opportunity_detected=bool(data.get("opportunity_detected", False)),
            opportunity_details=data.get("opportunity_details", ""),
            suggested_reply=data.get("suggested_reply", ""),
            sentiment=data.get("sentiment", "neutre"),
            tags=data.get("tags", []),
            raw={"provider": "openai", "model": "gpt-4o-mini"},
        )
    except Exception as exc:
        logger.warning("OpenAI analysis failed: %s", exc)
        return None


def analyze_message(body: str, subject: str = "", tier: str = "free") -> AnalysisResult:
    result = _openai_analysis(body, subject, tier)
    if result:
        return result
    return _heuristic_analysis(body, subject, tier)
