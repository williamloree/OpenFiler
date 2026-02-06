# OpenFiler

Service Node.js/Express de gestion de fichiers avec interface de navigation style MinIO, logging structure et authentification par token.

## Demarrage rapide

### 1. Configuration

Creez un fichier `.env` :

```env
NODE_ENV=production
APP_PORT=3200
APP_HOST=0.0.0.0
APP_ALLOWED_ORIGIN=*
```

### 2. Installation

```bash
npm install
```

### 3. Lancement

```bash
# Developpement (hot-reload)
npm run dev

# Production
npm run build && npm start

# Docker
docker-compose up --build
```

### 4. Acces

Ouvrez `http://localhost:3200/?token=admin123`

## Interface File Browser

L'interface principale (`/`) est un navigateur de fichiers inspire de MinIO Console :

- **Sidebar** : navigation par dossier (images, videos, documents) avec compteurs et stats de stockage
- **Tableau triable** : nom, type, taille, date de modification
- **Recherche** en temps reel
- **Preview inline** : images, videos HTML5, PDFs en iframe
- **Upload** : drag & drop ou selection de fichiers
- **Suppression** : unitaire ou par lot (selection multiple)
- **Telechargement** force via bouton d'action

## Authentification

L'interface est protegee par un token d'acces :

- **Token par defaut** : `admin123`
- **Modifier** : changer `HARD_CODED_TOKEN` dans `src/middleware/auth.middleware.ts`
- Acces via query param : `/?token=VOTRE_TOKEN`

## API Endpoints

### Upload de fichiers

```
POST /api/upload
Content-Type: multipart/form-data
```

Champs : `image` (max 6), `video` (max 2), `document` (max 3). Limite : 64 MB/fichier.

```javascript
const formData = new FormData();
formData.append('image', file);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

### Suppression

```
DELETE /api/files
Content-Type: application/json

{ "name": "1642234567890_fichier.jpg", "type": "image/jpeg" }
```

### Lister les fichiers

```
GET /api/files
GET /api/files?folder=image
```

### Info fichier

```
GET /api/files/:folder/:name
```

### Statistiques de stockage

```
GET /api/stats
```

Reponse :

```json
{
  "totalFiles": 42,
  "totalSize": 125829120,
  "folders": {
    "image": { "count": 30, "size": 89128960 },
    "video": { "count": 5, "size": 31457280 },
    "document": { "count": 7, "size": 5242880 }
  }
}
```

### Telechargement force

```
GET /api/download/:folder/:name
```

### Health Check

```
GET /api/health
```

### Types autorises

```
GET /api/config/allowed-types
```

## Logging structure

Le projet utilise [Pino](https://github.com/pinojs/pino) pour le logging structure :

- **Production** : JSON (exploitable par ELK, Datadog, etc.)
- **Developpement** : pretty-print colore

Chaque requete est tracee avec un `requestId` unique (header `X-Request-Id`).

Exemple de log en production :

```json
{
  "level": 30,
  "time": "2026-02-06T14:38:36.392Z",
  "service": "openfiler",
  "version": "1.0.0",
  "requestId": "65b39558-36d1-42be-86e5-4723bf60f284",
  "method": "GET",
  "url": "/api/health",
  "statusCode": 200,
  "durationMs": 5,
  "event": "request_end"
}
```

Evenements traces : `request_start`, `request_end`, `files_uploaded`, `file_deleted`, `file_downloaded`, `upload_error`, `auth_no_token`, `auth_invalid_token`.

## Preview de fichiers

Les fichiers uploades sont accessibles directement :

```
http://localhost:3200/preview/image/fichier.jpg
http://localhost:3200/preview/video/video.mp4
http://localhost:3200/preview/document/document.pdf
```

## Structure du projet

```
├── public/
│   └── browser.html          # Interface file browser
├── src/
│   ├── index.ts               # Point d'entree Express
│   ├── @types/                # Definitions TypeScript
│   ├── config/
│   │   ├── logger.ts          # Configuration Pino
│   │   └── multerConfig.ts    # Configuration upload
│   ├── controller/
│   │   └── fileController.ts  # Logique metier
│   ├── helpers/
│   │   ├── error-handler.helper.ts
│   │   └── slug.helper.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── request-logger.middleware.ts
│   └── routes/
│       └── file.routes.ts
├── upload/                    # Stockage des fichiers
│   ├── image/
│   ├── video/
│   └── document/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Types MIME acceptes

| Categorie | Formats |
|-----------|---------|
| Images | JPEG, PNG, SVG, WebP, BMP |
| Videos | MP4, AVI, MOV, WMV, FLV, WebM, MKV |
| Documents | PDF, DOCX |

## Docker

- **Image** : Node.js 22.16 slim, multi-stage build
- **Securite** : utilisateur `node` non-root
- **Health check** integre (`/api/health`)
- **Volume** : `filer_uploads` pour la persistance
- **Limites** : 512 MB memoire, 0.5 CPU

```bash
npm run build:docker    # Build
npm run start:docker    # Demarrer
npm run logs:docker     # Logs
npm run stop:docker     # Arreter
```

## Scripts

```bash
npm run dev             # Dev avec hot-reload
npm run build           # Compilation TypeScript
npm start               # Production
npm run build:docker    # Build Docker
npm run start:docker    # Start Docker
npm run logs:docker     # Logs Docker
npm run stop:docker     # Stop Docker
```

## Securite

- Authentification par token sur l'interface
- Validation stricte des types MIME
- Limitation de taille (64 MB) et nombre de fichiers
- Isolation Docker avec utilisateur non-root
- Logging structure pour audit et tracabilite
- Header `X-Request-Id` sur chaque reponse

## Depannage

```bash
# Verifier le service
curl http://localhost:3200/api/health

# Voir les logs Docker
docker-compose logs -f filer

# Rebuild complet
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```
