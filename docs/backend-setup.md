---
aliases: [backend-setup]
description: A guide for setting up the FinanSaku backend project locally.
lastUpdated: 2025-11-06
maintainer: FinanSaku Backend Team
---

# Backend Setup Guide

This document provides a step-by-step guide for setting up the **FinanSaku backend** project in a local development environment.

---

## 1. Requirements

| Tool       | Version | Notes                                   |
|------------|---------|-----------------------------------------|
| Node.js    | ≥ 18.x  | Use the LTS version for stability       |
| PostgreSQL | ≥ 14.x  | Supabase is recommended for cloud host  |
| Prisma     | Latest  | ORM used for database access            |
| npm        | ≥ 9.x   | You may also use pnpm or yarn           |

---

## 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/COFFEE-CODE-COMMUNITY/finansaku-be.git
cd finansaku-be
npm install
````

---

## 3. Environment Variables

Duplicate the example environment file and update it with your configuration:

```bash
cp .env.example .env
```

Example `.env`:

```env
# === Server Config ===
PORT=3000
NODE_ENV=development

# === Database Config ===
DATABASE_URL="postgresql://user:password@localhost:5432/finansaku"
DIRECT_URL="postgresql://user:password@localhost:5432/finansaku"

# === JWT / Tokens ===
ACCESS_TOKEN_SECRET="local-access-secret"
REFRESH_TOKEN_SECRET="local-refresh-secret"
ACCESS_TOKEN_EXPIRES=1h
REFRESH_TOKEN_EXPIRES=7d

# === Redis (optional in local) ===
ENABLE_REDIS=false
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://127.0.0.1:6379

# === Logging ===
LOG_LEVEL=info
LOG_PRETTY=true
LOG_WITH_REQ_ID=true
LOG_REDACT=password,authorization,access_token,refresh_token

# === Google OAuth2 ===
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
CLIENT_WEB_REDIRECT=http://localhost:5173/oauth-success
```

> Ensure your database credentials match your local or Supabase setup.
> OAuth2 variables must match the redirect URIs configured in your Google Cloud Console.

---

## 4. Prisma Setup

Apply migrations and generate the Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

To verify the connection and inspect your data, open Prisma Studio:

```bash
npx prisma studio
```

---

## 5. Running the Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at:

```bash
http://localhost:3000
```

Health endpoint (for quick checks):

```bash
GET http://localhost:3000/api/v1/health
```

---

## 6. Folder Structure

```bash
finansaku-be/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.js
├─ src/
│  ├─ config/
│  │  ├─ index.js
│  │  ├─ logger.js
│  │  └─ redis.js
│  ├─ controllers/
│  ├─ routes/
│  │  └─ health.routes.js
│  ├─ services/
│  ├─ middlewares/
│  ├─ dto/
│  ├─ utils/
│  ├─ app.js
│  └─ server.js
├─ docs/
│  ├─ backend-setup.md
│  ├─ infrastructure.md
│  ├─ auth.md
│  ├─ commit-guide.md
│  └─ contribution.md
├─ .env.example
├─ package.json
└─ README.md
```

---

## Notes

- Use feature branches (`feat/*`) for new development work.
- Keep `main` clean; all merges should go through pull requests.
- Always apply the latest migrations before testing or deploying changes.
- Redis is optional for local dev; enable it with `ENABLE_REDIS=true` when needed.
- Google OAuth2 setup requires valid redirect URIs and test users on Google Cloud.
- Check `/api/v1/health` to verify uptime and Redis status.
