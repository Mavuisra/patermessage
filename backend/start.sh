#!/usr/bin/env bash
set -o errexit

# SQLite : db.sqlite3 est gitignoré → non inclus dans l'artifact Render après le build.
# Les migrations doivent tourner au démarrage pour créer les tables.
python manage.py migrate --noinput
python manage.py setup_owner

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers 2 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
