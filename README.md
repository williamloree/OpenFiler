# 📁 OpenFiler

Service Node.js Express sécurisé pour la gestion de fichiers (upload & suppression) avec authentification par token.

## ⚡ Démarrage rapide

### 1. Configuration

Créez un fichier `.env` dans le dossier racine :

```env
NODE_ENV=production
APP_PORT=3200
APP_HOST=0.0.0.0
APP_ALLOWED_ORIGIN=*
```

### 2. Lancement avec Docker

```bash
docker-compose up --build
```

### 3. Accès à l'interface web sécurisée

1. Allez sur `http://localhost:3200/`
2. Entrez le token d'accès : `admin123`
3. Ou directement : `http://localhost:3200/?token=admin123`

## 🔐 Authentification

L'interface web est protégée par un token d'accès simple :

- **Token par défaut** : `admin123`
- **Pour modifier** : Changez `HARD_CODED_TOKEN` dans `src/middleware/auth.middleware.ts`

## 📋 API Endpoints

### 📤 Upload de fichiers

```bash
POST http://localhost:3200/api/upload
Content-Type: multipart/form-data
```

**Champs acceptés :**

- `image` : Images (JPG, PNG, SVG, WebP, BMP) - Max 6 fichiers
- `video` : Vidéos (MP4, AVI, MOV, WMV, FLV, WebM, MKV) - Max 2 fichiers
- `document` : Documents (PDF, DOCX) - Max 3 fichiers
- **Limite** : 64MB par fichier

**Exemple JavaScript :**

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('video', videoInput.files[0]);
formData.append('document', docInput.files[0]);

const response = await fetch('http://localhost:3200/api/upload', {
    method: 'POST',
    body: formData
});
```

### 🗑️ Suppression de fichiers

```bash
DELETE http://localhost:3200/api/files
Content-Type: application/json
```

**Body JSON :**

```json
{
    "name": "1642234567890_mon-fichier.jpg",
    "type": "image/jpeg"
}
```

### 📋 Lister les fichiers

```bash
GET http://localhost:3200/api/files
GET http://localhost:3200/api/files?folder=image
```

### 🔍 Informations d'un fichier

```bash
GET http://localhost:3200/api/files/:folder/:name
```

### ❤️ Health Check

```bash
GET http://localhost:3200/api/health
```

### ⚙️ Types autorisés

```bash
GET http://localhost:3200/api/config/allowed-types
```

## 📂 Structure des fichiers

```bash
/
├── src/                 # Code source TypeScript
├── public/             # Interface web sécurisée
│   └── filer-service-form.html
├── upload/             # Fichiers uploadés
│   ├── image/         # Images
│   ├── video/         # Vidéos
│   └── document/      # Documents PDF/DOCX
└── dist/              # Code compilé
```

## 🖼️ Prévisualisation des fichiers

Les fichiers uploadés sont accessibles via :

```bash
http://localhost:3200/preview/image/nom-du-fichier.jpg
http://localhost:3200/preview/video/ma-video.mp4
http://localhost:3200/preview/document/mon-document.pdf
```

## 🐳 Docker

### Dockerfile

- **Base** : Node.js 22.16 slim
- **Multi-stage build** pour optimiser la taille
- **Permissions** : Utilisateur `node` non-root
- **Health check** intégré

### Docker Compose

```yaml
version: "3.8"
services:
  filer:
    container_name: filer-service
    build: .
    env_file: .env
    ports:
      - "3200:3200"
    volumes:
      - filer_uploads:/app/upload
    restart: unless-stopped

volumes:
  filer_uploads:
    driver: local
```

### Documents

- `application/pdf` - Documents PDF
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - DOCX

### Images

- `image/jpeg`, `image/jpg` - Photos JPEG
- `image/png` - Images PNG
- `image/svg+xml` - Images vectorielles SVG
- `image/webp` - Format WebP moderne
- `image/bmp` - Bitmap

### Vidéos

- `video/mp4` - Vidéos MP4 (recommandé)
- `video/avi` - Format AVI
- `video/mov` - Format QuickTime
- `video/wmv` - Windows Media Video
- `video/flv` - Flash Video
- `video/webm` - Format WebM
- `video/mkv` - Matroska Video

## 🚀 Scripts disponibles

```bash
# Développement
npm run dev

# Build
npm run build

# Production
npm run start

# Docker
npm run build:docker
npm run start:docker
npm run logs:docker
npm run stop:docker
```

## 🔒 Sécurité

- ✅ **Authentification** par token sur l'interface web
- ✅ **Validation stricte** des types MIME
- ✅ **Limitation** de taille et nombre de fichiers
- ✅ **Isolation Docker** avec utilisateur non-root
- ✅ **Gestion d'erreurs** robuste

## 📊 Limites actuelles

- **Taille max** : 64MB par fichier
- **Images** : 6 fichiers maximum
- **Vidéos** : 2 fichiers maximum
- **Documents** : 3 fichiers maximum
- **Types** : Seulement ceux listés ci-dessus

## 🐛 Dépannage

### Problème de permissions Docker

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Vérifier les logs

```bash
docker-compose logs -f filer
```

### Tester l'API

```bash
curl http://localhost:3200/api/health
```
