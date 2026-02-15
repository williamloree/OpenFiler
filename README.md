# OpenFiler

<div align="center">

**Plateforme moderne de gestion de fichiers open-source**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Fonctionnalités](#-fonctionnalités) • [Installation](#-installation) • [Documentation](#-documentation) • [Contribuer](#-contribuer)

</div>

---

## 📖 À propos

OpenFiler est une application web complète de gestion de fichiers construite avec les technologies les plus récentes. Elle offre un système de partage de fichiers sécurisé avec suivi analytique, corbeille, protection anti-brute force et bien plus.

> **Rewrite complet** — Ce projet est une refonte complète de l'ancienne version Express.js vers une architecture moderne Next.js 15 App Router.

### ✨ Fonctionnalités

#### 📁 Gestion de fichiers
- **Upload drag & drop** — Téléversez plusieurs fichiers simultanément avec barre de progression
- **Prévisualisation** — Aperçu en ligne pour images, vidéos, PDFs et documents
- **Organisation** — Classement automatique par type (images, vidéos, documents)
- **Recherche** — Filtrage en temps réel par nom de fichier
- **Renommage** — Modification des noms de fichiers en un clic
- **Visibilité** — Marquez des fichiers comme privés ou publics
- **Téléchargement** — Téléchargement individuel ou par lot (ZIP)

#### 📊 Suivi analytique
- **Statistiques détaillées** — Vues, téléchargements, visiteurs uniques par fichier
- **Historique complet** — Journalisation de chaque accès avec IP, navigateur, source
- **Vue d'ensemble** — Tableau de bord avec statistiques agrégées
- **Vue détaillée** — Analyse approfondie fichier par fichier

#### 🗑️ Corbeille
- **Suppression sécurisée** — Les fichiers supprimés sont déplacés dans la corbeille
- **Restauration** — Récupérez facilement des fichiers supprimés par erreur
- **Suppression définitive** — Suppression permanente individuelle ou par lot
- **Métadonnées** — Conservation de l'auteur et de la date de suppression

#### 🔗 Partage
- **Liens partagés** — Générez des liens publics avec expiration automatique
- **Durée personnalisable** — 1h, 24h, 7j ou 30 jours
- **Accès anonyme** — Les liens partagés ne nécessitent pas d'authentification
- **Suivi** — Les accès via liens partagés sont tracés dans les analytics

#### 🛡️ Sécurité
- **Système fail2ban** — Protection automatique contre les attaques par force brute
- **Bannissement IP** — Bannissement automatique après 5 tentatives échouées
- **Gestion des bans** — Interface d'administration pour bannir/débannir manuellement
- **Historique des tentatives** — Journal complet des tentatives de connexion
- **Bans temporaires/permanents** — Configuration flexible des durées de bannissement

#### 🎨 Interface utilisateur
- **Design moderne** — Interface épurée avec Tailwind CSS v4
- **Mode responsive** — Optimisé pour desktop, tablette et mobile
- **Actions par lot** — Sélection multiple avec barre d'actions groupées
- **Notifications toast** — Retours visuels pour toutes les actions
- **Tri des colonnes** — Triez par nom, type, taille, date ou statistiques

---

## 🚀 Installation

### Prérequis

- **Node.js** 18+ et npm
- **Git** pour cloner le dépôt

### Installation rapide

```bash
# Cloner le dépôt
git clone https://github.com/williamloree/OpenFiler.git
cd OpenFiler

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env

# Générer une clé secrète
openssl rand -base64 32

# Éditer .env et coller la clé dans BETTER_AUTH_SECRET
nano .env

# Créer les tables de la base de données
npx @better-auth/cli@latest migrate --config lib/auth/server.ts

# Lancer en développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) et connectez-vous avec :
- **Email:** `admin@openfiler.local`
- **Mot de passe:** `admin1234`

⚠️ **Important :** Changez le mot de passe par défaut en production !

---

## 📦 Déploiement

### Développement local

```bash
npm run dev
```

### Production (Node.js)

```bash
npm run build
npm start
```

### Production (Docker)

```bash
# Build et démarrage
docker-compose up -d

# Logs
docker-compose logs -f

# Arrêt
docker-compose down
```

Le conteneur expose le port 3000 par défaut.

---

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine :

```env
# Authentication
BETTER_AUTH_SECRET=your-secret-key-here-use-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=./openfiler.db

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Variable | Description | Requis |
|----------|-------------|--------|
| `BETTER_AUTH_SECRET` | Clé secrète pour signer les sessions (générez avec `openssl rand -base64 32`) | ✅ |
| `BETTER_AUTH_URL` | URL de base de l'application | ✅ |
| `DATABASE_URL` | Chemin vers le fichier SQLite (ou URL PostgreSQL/MySQL) | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'app (utilisée par le client auth) | ✅ |

### Base de données

Par défaut, OpenFiler utilise SQLite avec `better-sqlite3`. Les tables sont créées automatiquement au démarrage via `instrumentation.ts` et `lib/seed.ts`.

**Tables créées :**
- `user`, `session`, `account`, `verification` (Better Auth)
- `file_metadata` (métadonnées de fichiers)
- `trash` (corbeille)
- `api_token` (tokens API)
- `share_link` (liens de partage)
- `file_view` (suivi analytique)
- `login_attempt` (tentatives de connexion)
- `banned_ip` (IPs bannies)

**Migration vers PostgreSQL/MySQL :**

1. Modifiez `DATABASE_URL` dans `.env` :
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/openfiler
   ```

2. Mettez à jour `lib/auth/server.ts` pour utiliser le bon adaptateur Better Auth

3. Remplacez `better-sqlite3` par `pg` ou `mysql2` dans `lib/seed.ts`

### Stockage des fichiers

Les fichiers sont stockés dans `upload/` par défaut :
- `upload/image/` — Images (JPEG, PNG, SVG, WebP, BMP, ICO)
- `upload/video/` — Vidéos (MP4, AVI, MOV, WMV, FLV, WebM, MKV)
- `upload/document/` — Documents (PDF, DOCX)
- `upload/trash/` — Fichiers supprimés

**Limites par défaut :**
- **Taille max par fichier :** 64 MB
- **Fichiers par upload :** 6 images, 2 vidéos, 3 documents

Modifiez ces limites dans `lib/upload-config.ts`.

---

## 📚 Documentation

### Architecture

```
OpenFiler/
├── app/
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Redirection vers /dashboard ou /login
│   ├── login/                  # Page de connexion
│   ├── dashboard.tsx           # Application principale (client component)
│   ├── share/[token]/          # Route de partage public
│   └── api/                    # Routes API
│       ├── auth/[...all]/      # Better Auth (sign-in, sign-out)
│       ├── upload/             # Upload de fichiers
│       ├── files/              # CRUD fichiers
│       ├── preview/            # Prévisualisation
│       ├── download/           # Téléchargement
│       ├── stats/              # Statistiques de stockage
│       ├── trash/              # Gestion de la corbeille
│       ├── share/              # Gestion des liens de partage
│       ├── tracking/           # Données analytiques
│       ├── security/           # Fail2ban management
│       └── config/             # Configuration
├── components/
│   ├── Sidebar.tsx             # Navigation latérale
│   ├── Toolbar.tsx             # Barre d'outils et recherche
│   ├── BatchBar.tsx            # Actions groupées
│   ├── Modals.tsx              # Modals (upload, settings, preview)
│   ├── Toasts.tsx              # Système de notifications
│   └── table/
│       ├── Table.tsx           # Tableau de fichiers
│       ├── TrashTable.tsx      # Tableau de corbeille
│       ├── TrackingTable.tsx   # Tableau de suivi
│       └── SecurityTables.tsx  # Tableaux de sécurité
├── lib/
│   ├── auth/
│   │   ├── server.ts           # Instance Better Auth
│   │   ├── client.ts           # Helpers client
│   │   └── require-session.ts  # Middleware de session
│   ├── seed.ts                 # Initialisation DB + user par défaut
│   ├── metadata.ts             # Gestion des métadonnées (JSON)
│   ├── trash.ts                # Logique de la corbeille
│   ├── share.ts                # Logique des liens partagés
│   ├── tracking.ts             # Logique de suivi analytique
│   ├── security.ts             # Système fail2ban
│   ├── mime.ts                 # Détection de types MIME
│   ├── slug.ts                 # Slugification des noms de fichiers
│   ├── upload-config.ts        # Configuration d'upload
│   └── ensure-dirs.ts          # Création des dossiers d'upload
├── types/
│   └── index.ts                # Types TypeScript partagés
├── middleware.ts               # Middleware Next.js (blocage /signup)
├── instrumentation.ts          # Hook de démarrage (seed user)
└── public/                     # Assets statiques
```

### API Routes

#### Authentification
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/sign-in/email` | Public | Connexion par email/password |
| POST | `/api/auth/sign-out` | Session | Déconnexion |

#### Fichiers
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/upload` | Session | Upload de fichiers |
| GET | `/api/files` | Session | Liste des fichiers (optionnel `?folder=`) |
| DELETE | `/api/files` | Session | Suppression (déplace vers corbeille) |
| GET | `/api/files/[folder]/[name]` | Session | Informations d'un fichier |
| PATCH | `/api/files/visibility` | Session | Basculer privé/public |
| PATCH | `/api/files/rename` | Session | Renommer un fichier |
| GET | `/api/preview/[folder]/[name]` | Session* | Prévisualiser (* si privé) |
| GET | `/api/download/[folder]/[name]` | Session* | Télécharger (* si privé) |
| POST | `/api/download/batch` | Session | Télécharger plusieurs fichiers (ZIP) |

#### Corbeille
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/trash` | Session | Liste des fichiers en corbeille |
| POST | `/api/trash/restore` | Session | Restaurer un fichier |
| DELETE | `/api/trash` | Session | Suppression définitive |

#### Partage
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/share` | Session | Créer un lien de partage |
| GET | `/api/share` | Session | Liste des liens actifs |
| DELETE | `/api/share` | Session | Supprimer un lien |
| GET | `/share/[token]` | Public | Accéder à un fichier partagé |

#### Analytics
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/tracking` | Session | Statistiques globales |
| GET | `/api/tracking?folder=X&filename=Y` | Session | Détails d'un fichier |
| DELETE | `/api/tracking` | Session | Supprimer des logs de suivi |

#### Sécurité
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/security?type=bans` | Session | Liste des IPs bannies |
| GET | `/api/security?type=attempts` | Session | Liste des tentatives de connexion |
| POST | `/api/security` | Session | Bannir une IP manuellement |
| DELETE | `/api/security?ip=X` | Session | Débannir une IP |

#### Divers
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/stats` | Session | Statistiques de stockage |
| GET | `/api/health` | Public | Health check |
| GET | `/api/config/allowed-types` | Public | Types MIME autorisés |

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Suivez ces étapes pour contribuer au projet.

### Workflow de contribution

1. **Fork** le dépôt
2. **Clone** votre fork :
   ```bash
   git clone https://github.com/votre-username/OpenFiler.git
   cd OpenFiler
   ```
3. **Créez une branche** pour votre feature :
   ```bash
   git checkout -b feat/ma-nouvelle-feature
   ```
4. **Installez les dépendances** :
   ```bash
   npm install
   ```
5. **Développez** votre fonctionnalité
6. **Testez** vos modifications
7. **Committez** avec des messages conventionnels (voir ci-dessous)
8. **Poussez** vers votre fork :
   ```bash
   git push origin feat/ma-nouvelle-feature
   ```
9. **Ouvrez une Pull Request** vers la branche `develop`

### Conventional Commits

Ce projet utilise la spécification [Conventional Commits](https://www.conventionalcommits.org/). Chaque commit doit suivre ce format :

```
<type>[scope optionnel]: <description>

[corps optionnel]

[footer optionnel]
```

**Types de commits :**

| Type | Utilisation |
|------|-------------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `style` | Formatage (pas de changement de logique) |
| `refactor` | Refactoring de code |
| `perf` | Amélioration de performance |
| `test` | Ajout/modification de tests |
| `build` | Build system ou dépendances |
| `ci` | Configuration CI/CD |
| `chore` | Maintenance, tâches diverses |

**Exemples :**

```bash
feat(tracking): add batch delete for tracking logs
fix(security): prevent SQL injection in ban IP endpoint
docs(readme): update installation instructions
refactor(upload): simplify file validation logic
```

### Guidelines de code

- **TypeScript strict** — Utilisez les types partout, évitez `any`
- **Composants fonctionnels** — Utilisez React hooks, pas de classes
- **Server/Client séparé** — Marquez les composants clients avec `"use client"`
- **API synchrone** — Utilisez `better-sqlite3` de manière synchrone (pas de promesses)
- **Gestion d'erreurs** — Loggez les erreurs, retournez des messages clairs
- **Sécurité** — Validez toutes les entrées, sanitizez les données, évitez les injections

### Structure des issues

Utilisez les labels appropriés :
- `bug` — Dysfonctionnement à corriger
- `enhancement` — Amélioration d'une fonctionnalité existante
- `feature` — Nouvelle fonctionnalité
- `documentation` — Amélioration de la documentation
- `question` — Question ou discussion

### Pull Requests

- **Ciblez `develop`** — Toutes les PRs doivent cibler la branche `develop`, pas `main`
- **Description claire** — Expliquez ce que fait votre PR et pourquoi
- **Tests** — Assurez-vous que tout fonctionne en local
- **Pas de breaking changes** — Sauf si absolument nécessaire et documenté
- **Un sujet par PR** — Ne mélangez pas plusieurs fonctionnalités non liées

---

## 🛠️ Stack technique

| Catégorie | Technologie |
|-----------|-------------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org/) |
| **UI** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Auth** | [Better Auth 1.2](https://www.better-auth.com/) |
| **Database** | SQLite ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3)) |
| **File handling** | Node.js `fs`, [archiver](https://www.npmjs.com/package/archiver) |
| **Linting** | ESLint 9 |

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [Better Auth](https://www.better-auth.com/) pour le système d'authentification simple et sécurisé
- [Next.js](https://nextjs.org/) pour le framework React full-stack
- [Tailwind CSS](https://tailwindcss.com/) pour le système de design utility-first
- Tous les contributeurs qui rendent ce projet possible

---

<div align="center">

**Fait avec ❤️ par la communauté**

[⭐ Star ce projet](https://github.com/williamloree/OpenFiler) • [🐛 Reporter un bug](https://github.com/williamloree/OpenFiler/issues) • [💡 Suggérer une feature](https://github.com/williamloree/OpenFiler/issues/new)

</div>
