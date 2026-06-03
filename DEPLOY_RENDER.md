# Déployer Black Panther sur Render (gratuit)

## Un seul repo GitHub, deux projets

Tout est dans **un dépôt** (`patermessage`), mais Render crée **3 ressources séparées** :

```
patermessage/          ← repo GitHub (une seule fois)
├── backend/           → Service 1 : API (Web Service / Python)
├── frontend/          → Service 2 : site (Static Site)
└── render.yaml        → dit à Render quel dossier = quel type
```

Render ne devine pas tout seul : c’est **`rootDir`** + **`runtime`** qui choisissent.

| Service Render | Type dans le dashboard | Dossier (`Root Directory`) | Build |
|----------------|------------------------|------------------------------|--------|
| **blackpanther-api** | **Web Service** | `backend` | `./build.sh` |
| **blackpanther-web** | **Static Site** | `frontend` | `npm install && npm run build` |
| **blackpanther-db** | **PostgreSQL** | — | — |

Vous aurez **2 URLs différentes** :
- Site (React) : `https://blackpanther-web.onrender.com`
- API (Django) : `https://blackpanther-api.onrender.com`

---

## Méthode A — Blueprint (recommandé, les 2 d’un coup)

1. Render → **New** → **Blueprint**
2. Connectez **Mavuisra/patermessage** (une seule fois)
3. Render lit `render.yaml` et propose **3 créations** : DB + API + Static
4. Validez → les deux projets sont créés automatiquement avec le bon dossier

Pas besoin de choisir Static vs Web à la main : le fichier `render.yaml` le fait déjà.

---

## Méthode B — À la main (créer 2 services séparés)

Si vous créez **un par un** sans Blueprint :

### Étape 1 — Backend (Web Service, pas Static)

1. **New** → **Web Service** (pas « Static Site »)
2. Repo : `patermessage`
3. **Root Directory** : `backend` ← obligatoire
4. Runtime : **Python 3**
5. Build : `chmod +x build.sh start.sh && ./build.sh`
6. Start : `chmod +x start.sh && ./start.sh`
7. Variables : voir tableau plus bas

### Étape 2 — Frontend (Static Site, pas Web Service)

1. **New** → **Static Site** (pas « Web Service »)
2. Même repo : `patermessage`
3. **Root Directory** : `frontend` ← obligatoire
4. Build : `npm install && npm run build`
5. Publish directory : `dist`
6. **Redirects/Rewrites** : `/*` → `/index.html` (SPA React)
7. Variable : `VITE_API_URL` = `https://patermessager.onrender.com/api`

### Erreur fréquente

| Mauvais choix | Conséquence |
|---------------|-------------|
| Static Site avec `rootDir` = `backend` | Échec (pas de `package.json` React) |
| Web Service avec `rootDir` = `frontend` | Échec (pas de `gunicorn` / Django) |
| Un seul service pour tout le repo | Render ne sait pas quoi builder |

---

## Architecture

| Service | Type | Rôle |
|---------|------|------|
| `blackpanther-db` | PostgreSQL gratuit | Base de données |
| `blackpanther-api` | Web Service gratuit | API Django |
| `blackpanther-web` | Static Site gratuit | React (Vite) |

## Méthode rapide (Blueprint) — détail

1. Créez un compte sur [render.com](https://render.com).
2. Poussez le projet sur **GitHub** ou **GitLab**.
3. Render → **New** → **Blueprint** → connectez le dépôt.
4. Render détecte `render.yaml` et crée les 3 ressources.
5. Variables à renseigner à la main :

### `blackpanther-api`

| Variable | Exemple |
|----------|---------|
| `DJANGO_SUPERUSER_PASSWORD` | mot de passe propriétaire fort |
| `CORS_ALLOWED_ORIGINS` | `https://VOTRE-SITE-FRONT.onrender.com` |
| `ALLOWED_HOSTS` | `patermessager.onrender.com` |

### `blackpanther-web`

| Variable | Exemple |
|----------|---------|
| `VITE_API_URL` | `https://patermessager.onrender.com/api` |

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

### 1. Base de données (au choix)

**Option A — SQLite (simple, sans PostgreSQL)**

Sur le Web Service API, ajoutez :

| Variable | Valeur |
|----------|--------|
| `USE_SQLITE` | `true` |
| `RENDER` | `true` |
| `DEBUG` | `false` |

Ne mettez **pas** `DATABASE_URL`. Au build, `migrate` crée `backend/db.sqlite3`.

> ⚠️ Sur Render gratuit, le disque est **éphémère** : comptes et messages peuvent disparaître après un redéploiement. Pour des données permanentes, utilisez PostgreSQL (option B).

**Option B — PostgreSQL (recommandé en prod)**

New → PostgreSQL → Free → copiez **Internal Database URL** → variable `DATABASE_URL` sur l’API.

### 2. API Web

- New → **Web Service** (pas Static Site) → repo → **Root Directory** : `backend`
- Runtime : **Python 3.12** (variable `PYTHON_VERSION` = `3.12.7`)
- **Build Command** : `chmod +x build.sh start.sh && ./build.sh`
- **Start Command** : `chmod +x start.sh && ./start.sh`  
  *(ou laisser vide si Render lit `backend/Procfile` — **ne pas** laisser `gunicorn your_application.wsgi`)*
- Variables : `SECRET_KEY`, `DEBUG=false`, `RENDER=true`, `USE_SQLITE=true` (ou `DATABASE_URL` si PostgreSQL), etc.

#### Erreur `No module named 'your_application'`

Render utilise la commande **par défaut** du template Python. Corrigez dans **Settings → Start Command** :

```
chmod +x start.sh && ./start.sh
```

Ou directement :

```
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

Le module Django s’appelle **`config.wsgi`**, pas `your_application.wsgi`.

### 3. Frontend Static

- New → Static Site → **Root Directory** : `frontend`
- Build : `npm install && npm run build`
- Publish : `dist`
- Rewrite `/*` → `/index.html`
- `VITE_API_URL` = URL API + `/api`

## Vérifier que l’API fonctionne

```
https://patermessager.onrender.com/api/health/
```

Réponse attendue : `{"status":"ok"}`

## Stripe (optionnel)

Ajoutez sur l’API :

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (webhook URL : `https://patermessager.onrender.com/api/payments/webhook/stripe/`)

Sans Stripe, le mode **mock** de paiement reste actif en dev ; en prod configurez les clés ou adaptez le flux mock.

## Erreur inscription : « Unexpected end of JSON input »

Cause : l’API ne peut pas écrire en base (souvent PostgreSQL sur `localhost` sans `DATABASE_URL`).

### Correction avec SQLite (votre cas)

Web Service **`patermessager`** → **Environment** :

| Variable | Valeur |
|----------|--------|
| `USE_SQLITE` | `true` |
| `RENDER` | `true` |
| `DEBUG` | `false` |
| `DJANGO_SUPERUSER_PASSWORD` | mot de passe fort |
| `CORS_ALLOWED_ORIGINS` | URL de votre site static |

Supprimez `DATABASE_URL` si elle existe. Puis **Manual Deploy** → **Clear build cache & deploy**.

### Correction avec PostgreSQL

1. **New → PostgreSQL** (plan Free).
2. **`DATABASE_URL`** = Internal Database URL (ou « Link Database »).
3. Retirez `USE_SQLITE` ou mettez `false`.
4. Redéployez.
