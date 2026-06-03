#!/usr/bin/env bash
set -o errexit

if [ "${RENDER:-}" = "true" ] && [ "${USE_SQLITE:-}" != "true" ] && [ -z "${DATABASE_URL:-}" ]; then
  echo "INFO: pas de DATABASE_URL — SQLite sera utilisé (USE_SQLITE auto sur Render)."
fi

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
python manage.py setup_owner
