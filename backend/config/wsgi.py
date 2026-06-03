import os
from pathlib import Path

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")


def _run_startup_tasks() -> None:
    """Migrations au boot sur Render (Procfile / gunicorn sans start.sh)."""
    if os.getenv("RENDER", "").lower() != "true":
        return

    import django

    django.setup()
    from django.conf import settings
    from django.core.management import call_command

    lock_path = Path(settings.BASE_DIR) / "data" / ".migrate.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)

    with open(lock_path, "a+", encoding="utf-8") as lock_file:
        try:
            import fcntl

            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        except ImportError:
            pass
        call_command("migrate", verbosity=0, interactive=False)
        call_command("setup_owner", verbosity=0)


_run_startup_tasks()
application = get_wsgi_application()
