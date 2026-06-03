#!/usr/bin/env bash
set -o errexit

if [ "${RENDER:-}" = "true" ] && [ -z "${DATABASE_URL:-}" ] && [ -z "${SQLITE_DATA_DIR:-}" ]; then
  echo ""
  echo "ERROR: DATABASE_URL manquante sur Render."
  echo "SQLite sans disque persistant EFFACE toutes les données à chaque deploy."
  echo ""
  echo "Solution (gratuit) :"
  echo "  1. Render → New → PostgreSQL (Free)"
  echo "  2. Web Service → Environment → Link Database (DATABASE_URL)"
  echo "  3. Supprimez USE_SQLITE si présent"
  echo "  4. Redéployez"
  echo ""
  exit 1
fi

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
python manage.py setup_owner
