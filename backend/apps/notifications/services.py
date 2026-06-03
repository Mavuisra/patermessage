import logging

from django.conf import settings
from django.contrib.auth import get_user_model

from .models import DeviceToken, NotificationLog

logger = logging.getLogger(__name__)
User = get_user_model()

_firebase_app = None


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    if not settings.FIREBASE_CREDENTIALS_PATH:
        return None
    try:
        import firebase_admin
        from firebase_admin import credentials

        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception as exc:
        logger.warning("Firebase init failed: %s", exc)
        return None


def notify_owner(title: str, body: str, data: dict | None = None):
    data = data or {}
    owners = User.objects.filter(role=User.Role.OWNER)
    tokens = DeviceToken.objects.filter(user__in=owners).values_list("token", flat=True)

    log = NotificationLog.objects.create(title=title, body=body, data=data)
    success = 0

    if not tokens:
        logger.info("No FCM tokens — notification logged: %s", title)
        log.success_count = 0
        log.save(update_fields=["success_count"])
        return log

    app = _get_firebase_app()
    if not app:
        logger.info("FCM not configured — notification logged: %s", title)
        return log

    try:
        from firebase_admin import messaging

        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in data.items()},
            tokens=list(tokens),
        )
        response = messaging.send_each_for_multicast(message)
        success = response.success_count
    except Exception as exc:
        logger.error("FCM send failed: %s", exc)

    log.success_count = success
    log.save(update_fields=["success_count"])
    return log
