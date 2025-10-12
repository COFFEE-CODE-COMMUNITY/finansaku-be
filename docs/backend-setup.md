---
aliases: [backend-setup]
description: A guide for setting up the FinanSaku backend project locally.
lastUpdated: 2025-10-12
maintainer: FinanSaku Backend Team
---
# Backend Setup Guide

This document provides a step-by-step guide for setting up the **FinanSaku
backend** project in a local development environment.

---

## 1. Requirements

| Tool | Version | Notes |
|------|----------|-------|
| Node.js | ≥ 18.x | Use the LTS version for stability |
| PostgreSQL | ≥ 14.x | Supabase is recommended for cloud hosting |
| Prisma | Latest | ORM used for database access |
| npm | ≥ 9.x | You may also use pnpm or yarn |

---

## 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/COFFEE-CODE-COMMUNITY/finansaku-be.git
cd finansaku-be
npm install
```

---

## 3. Environment Variables

Duplicate the example environment file and update it with your configuration:

```bash
cp .env.example .env
```

Example `.env`:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/finansaku"
JWT_SECRET="supersecretkey"
```

> Ensure the database credentials and URL match your local or Supabase setup.

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

---

## 6. Folder Structure

```bash
finansaku-be/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.js
├─ src/
│  ├─ controllers/
│  ├─ routes/
│  ├─ services/
│  ├─ middlewares/
│  ├─ models/
│  ├─ utils/
│  └─ app.js
├─ docs/
│  ├─ backend-setup.md
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
