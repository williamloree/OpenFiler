# OpenFiler

Modern open-source file management platform built with Next.js.

> **Complete rewrite** — This is a full refactor from the original Express.js codebase to a modern Next.js App Router architecture.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Authentication:** [Better Auth](https://www.better-auth.com/)
- **Database:** SQLite (via better-sqlite3, swappable to PostgreSQL/MySQL)
- **Storage:** Local filesystem (upload/image, upload/video, upload/document)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/williamloree/OpenFiler.git
cd OpenFiler
npm install
```

### Configuration

Copy the example environment file and update it with your values:

```bash
cp .env.example .env
```

**Required environment variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Secret key for session signing (generate a random string) | — |
| `BETTER_AUTH_URL` | Base URL of the app | `http://localhost:3000` |
| `DATABASE_URL` | Path to SQLite database file | `./openfiler.db` |
| `NEXT_PUBLIC_APP_URL` | Public app URL (used by auth client) | `http://localhost:3000` |

Generate a secure secret:

```bash
openssl rand -base64 32
```

### Database Setup

Run the Better Auth migration to create the required tables (user, session, account, verification):

```bash
npx @better-auth/cli@latest migrate --config lib/auth/server.ts
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Use

1. Go to `/signup` to create your first account
2. You will be redirected to the dashboard (file browser)
3. Upload, preview, download, and manage your files

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home / landing page
│   ├── login/                     # Login page
│   ├── signup/                    # Sign up page
│   ├── dashboard/                 # File browser (protected)
│   └── api/
│       ├── auth/[...all]/         # Better Auth catch-all
│       ├── upload/                # POST  - file upload
│       ├── files/                 # GET   - list files
│       │   ├── route.ts           # DELETE - delete file
│       │   ├── [folder]/[name]/   # GET   - file info
│       │   └── visibility/        # PATCH - toggle private/public
│       ├── preview/[folder]/[name]/ # GET - serve/preview file
│       ├── download/[folder]/[name]/ # GET - download file
│       ├── stats/                 # GET   - storage statistics
│       ├── health/                # GET   - health check
│       └── config/allowed-types/  # GET   - allowed MIME types
├── components/
│   ├── file-browser.tsx           # Main file browser UI
│   └── sign-out-button.tsx        # Sign out button
├── lib/
│   ├── auth/
│   │   ├── server.ts              # Better Auth server instance
│   │   ├── client.ts              # Better Auth client helpers
│   │   └── require-session.ts     # Session guard for API routes
│   ├── metadata.ts                # File privacy metadata (JSON store)
│   ├── mime.ts                    # MIME type lookup
│   ├── slug.ts                    # Filename slugification
│   ├── upload-config.ts           # Allowed types, size limits
│   └── ensure-dirs.ts             # Upload directory bootstrap
├── .env.example                   # Environment variables template
├── next.config.js                 # Next.js configuration
├── postcss.config.mjs             # PostCSS / Tailwind config
└── tsconfig.json                  # TypeScript configuration
```

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/upload` | - | Upload files (image x6, video x2, document x3, 64MB max) |
| GET | `/api/files` | - | List all files (optional `?folder=image\|video\|document`) |
| DELETE | `/api/files` | - | Delete a file by name + type |
| GET | `/api/files/:folder/:name` | - | Get file info |
| PATCH | `/api/files/visibility` | Session | Toggle file private/public |
| GET | `/api/preview/:folder/:name` | Session* | Serve file for preview (* only if private) |
| GET | `/api/download/:folder/:name` | Session* | Download file (* only if private) |
| GET | `/api/stats` | - | Storage stats (total files, sizes per folder) |
| GET | `/api/health` | - | Health check |
| GET | `/api/config/allowed-types` | - | Allowed MIME types and limits |

## File Browser Features

- **Sidebar navigation** — filter by All / Images / Videos / Documents with live file counts
- **Storage stats** — total files, total size, visual progress bar
- **File table** — sortable by name, type, size, date
- **Search** — real-time filename filtering
- **Batch operations** — select multiple files, batch delete
- **Upload** — drag & drop or click to select, with progress indicator
- **Preview** — inline preview for images, videos, PDFs; detail view for other types
- **Visibility toggle** — mark files as private (requires session to access)
- **Responsive** — sidebar collapses on mobile

## Authentication

OpenFiler uses [Better Auth](https://www.better-auth.com/) for authentication:

- Email/password sign-up and sign-in
- Session management (7-day expiry, daily refresh)
- Server-side session validation for protected routes
- Extensible provider system (add OAuth, magic links, etc.)

No credentials are hardcoded — all sensitive values are loaded from environment variables.

## Supported File Types

| Category | Types | Max per upload |
|----------|-------|----------------|
| Image | JPEG, PNG, SVG, WebP, BMP, ICO | 6 |
| Video | MP4, AVI, MOV, WMV, FLV, WebM, MKV | 2 |
| Document | PDF, DOCX | 3 |

Max file size: **64 MB**

## Philosophy

OpenFiler aims to be a clean, extensible file management platform:

- **Simple by default** — works out of the box with SQLite and local storage
- **Production-ready architecture** — swap to PostgreSQL, add S3 storage, deploy to any cloud
- **Open-source first** — clean code, clear documentation, ready for contributions

## License

ISC
