# OpenFiler

Modern open-source file management platform built with Next.js.

> **Complete rewrite** — This is a full refactor from the original Express.js codebase to a modern Next.js App Router architecture.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Authentication:** [Better Auth](https://www.better-auth.com/)
- **Database:** SQLite (via better-sqlite3, swappable to PostgreSQL/MySQL)

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

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── login/            # Login page
│   ├── signup/           # Sign up page
│   ├── dashboard/        # Dashboard (protected)
│   └── api/auth/         # Better Auth API routes
├── components/           # Reusable UI components
├── lib/
│   └── auth/             # Auth configuration
│       ├── server.ts     # Server-side auth instance
│       └── client.ts     # Client-side auth helpers
├── .env.example          # Environment variables template
├── tailwind.config.ts    # Tailwind configuration
├── next.config.js        # Next.js configuration
└── tsconfig.json         # TypeScript configuration
```

## Authentication

OpenFiler uses [Better Auth](https://www.better-auth.com/) for authentication. It supports:

- Email/password sign-up and sign-in
- Session management with configurable expiry
- Server-side session validation for protected routes
- Extensible provider system (add OAuth, magic links, etc.)

No credentials are hardcoded — all sensitive values are loaded from environment variables.

## Philosophy

OpenFiler aims to be a clean, extensible file management platform:

- **Simple by default** — works out of the box with SQLite
- **Production-ready architecture** — swap to PostgreSQL, add S3 storage, deploy to any cloud
- **Open-source first** — clean code, clear documentation, ready for contributions

## License

ISC
