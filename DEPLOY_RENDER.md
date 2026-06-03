# Déployer Black Panther sur Render (gratuit)

## Architecture

| Service | Type | Rôle |
|---------|------|------|
| `blackpanther-db` | PostgreSQL gratuit | Base de données |
| `blackpanther-api` | Web Service gratuit | API Django |
| `blackpanther-web` | Static Site gratuit | React (Vite) |

## Méthode rapide (Blueprint)

1. Créez un compte sur [render.com](https://render.com).
2. Poussez le projet sur **GitHub** ou **GitLab**.
3. Render → **New** → **Blueprint** → connectez le dépôt.
4. Render détecte `render.yaml` et crée les 3 ressources.
5. Variables à renseigner à la main :

### `blackpanther-api`

| Variable | Exemple |
|----------|---------|
| `DJANGO_SUPERUSER_PASSWORD` | mot de passe propriétaire fort |
| `CORS_ALLOWED_ORIGINS` | `https://blackpanther-web.onrender.com` |
| `ALLOWED_HOSTS` | `blackpanther-api.onrender.com` |

### `blackpanther-web`

| Variable | Exemple |
|----------|---------|
| `VITE_API_URL` | `https://blackpanther-api.onrender.com/api` |

6. Attendez le premier déploiement (5–10 min).
7. Ouvrez l’URL du site statique (`blackpanther-web`).

## Connexion propriétaire

- URL : `https://VOTRE-SITE.onrender.com/adminpater`
- Utilisateur : `blackpanther`
- Mot de passe : celui défini dans `DJANGO_SUPERUSER_PASSWORD`

## Limites du plan gratuit Render

- Le service **s’endort** après ~15 min sans trafic (réveil ~30 s).
- **Fichiers média** (vocaux, PDF) : stockage disque éphémère — peuvent disparaître après redéploiement. Pour la prod sérieuse, prévoir S3 ou Render Disk payant.
- **Redis / Celery** : désactivé ; les analyses IA s’exécutent en synchrone (`CELERY_TASK_ALWAYS_EAGER=true`).

## Déploiement manuel (sans Blueprint)

### 1. Base PostgreSQL

New → PostgreSQL → Free → copiez **Internal Database URL**.

### 2. API Web

- New → Web Service → repo → **Root Directory** : `backend`
- Runtime : Python 3.12
- Build : `./build.sh`
- Start : `./start.sh`
- Variables : `DATABASE_URL`, `SECRET_KEY`, `DEBUG=false`, `RENDER=true`, etc.

### 3. Frontend Static

- New → Static Site → **Root Directory** : `frontend`
- Build : `npm install && npm run build`
- Publish : `dist`
- Rewrite `/*` → `/index.html`
- `VITE_API_URL` = URL API + `/api`

## Vérifier que l’API fonctionne

```
https://blackpanther-api.onrender.com/api/health/
```

Réponse attendue : `{"status":"ok"}`

## Stripe (optionnel)

Ajoutez sur l’API :

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (webhook URL : `https://blackpanther-api.onrender.com/api/payments/webhook/stripe/`)

Sans Stripe, le mode **mock** de paiement reste actif en dev ; en prod configurez les clés ou adaptez le flux mock.
