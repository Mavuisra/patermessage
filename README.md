# Black Pater — Plateforme premium

Plateforme web PWA pour monétiser le temps de Black Pater : messages filtrés par IA, messages premium payants, réservations d'appels, tableau de bord privé et notifications push (FCM).

## Stack

| Couche | Technologies |
|--------|----------------|
| Backend | Python, Django 5, Django REST Framework, PostgreSQL, Celery, Redis |
| Frontend | React 18, TypeScript, Vite, Framer Motion, PWA |
| Paiements | Stripe (mode mock sans clé API) |
| IA | OpenAI GPT-4o-mini (fallback heuristique sans clé) |
| Notifications | Firebase Cloud Messaging |

## Démarrage rapide (local sans Docker)

```bash
cd backend
pip install -r requirements.txt
set USE_SQLITE=true          # Windows CMD
# export USE_SQLITE=true     # macOS/Linux
python manage.py migrate
python manage.py setup_owner --password VotreMotDePasse
python manage.py seed_slots
python manage.py runserver
```

> En production, utilisez **PostgreSQL** (défaut sans `USE_SQLITE`). SQLite sert uniquement au développement local.

## Démarrage avec Docker

```bash
docker compose up -d db redis
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py setup_owner --password VotreMotDePasse
python manage.py seed_slots
celery -A config worker -l info
python manage.py runserver
```

Dans un autre terminal :

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

- **Page publique** : http://localhost:5173  
- **Espace propriétaire** : http://localhost:5173/adminpater → identifiants `admin` / `Admin@2026`  
- **API docs** : http://localhost:8000/api/docs/

## Variables d'environnement

Copiez `backend/.env.example` → `backend/.env` et `frontend/.env.example` → `frontend/.env`.

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Analyse IA avancée des messages |
| `STRIPE_SECRET_KEY` | Paiements réels (Stripe Checkout) |
| `FIREBASE_CREDENTIALS_PATH` | JSON compte de service Firebase (backend) |
| `FCM_VAPID_KEY` / `VITE_FIREBASE_*` | Notifications push web |

Sans Stripe, les paiements premium et appels utilisent `POST /api/payments/mock-confirm/` (intégré au frontend en dev).

## Fonctionnalités

1. **Page publique unique** — profil, envoi message gratuit/premium, réservation d'appel  
2. **Messages gratuits** — analyse IA (résumé, score, opportunités, réponse suggérée)  
3. **Messages premium** — priorité + paiement Stripe  
4. **Réservation d'appels** — créneaux + paiement  
5. **Dashboard privé** — messages, stats, paiements, réservations  
6. **Notifications push** — FCM temps réel (nouveau message analysé, nouvelle réservation)  
7. **Historique paiements** — API `/api/payments/history/`  
8. **Statistiques** — `/api/analytics/dashboard/`

## Design

- Inspiration iOS / Apple  
- Glassmorphism, blur, animations Framer Motion  
- Dark & Light mode  
- Couleur principale `#025dcc`  
- PWA installable (iPhone : Partager → Sur l'écran d'accueil ; Android : invite d'installation)

## Structure

```
patermessage/
├── backend/          # Django + DRF
│   └── apps/
│       ├── core/
│       ├── messages_app/
│       ├── bookings/
│       ├── payments/
│       ├── notifications/
│       └── analytics/
├── frontend/         # React + Vite PWA
└── docker-compose.yml
```

## Production

1. `DEBUG=False`, `SECRET_KEY` fort, HTTPS  
2. Configurer Stripe webhooks → `/api/payments/webhook/stripe/`  
3. Déployer worker Celery pour l'analyse asynchrone  
4. `npm run build` + servir `frontend/dist` (Nginx)  
5. Générer icônes PWA `pwa-192x192.png` et `pwa-512x512.png` dans `frontend/public/`  
6. Mettre à jour `firebase-messaging-sw.js` avec vos clés Firebase  

## Licence

Projet privé — usage exclusif Black Pater.
