# Backend Setup Guide

This document explains how to set up the **FinanSaku Backend** project locally.

---

## 1. Requirements

| Tool | Version | Notes |
|------|----------|-------|
| Node.js | ≥ 18.x | LTS recommended |
| PostgreSQL | ≥ 14.x | Use Supabase for remote DB |
| Prisma | Latest | ORM for database access |
| npm | ≥ 9.x | or use pnpm/yarn if preferred |

---

## 2. Installation

```bash
# Clone repository
git clone https://github.com/COFFEE-CODE-COMMUNITY/finansaku-be.git
cd finansaku-be

# Install dependencies
npm install
```

---

## 3. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then update the values:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/finansaku"
JWT_SECRET="supersecretkey"
```

---

## 4. Prisma Setup

```bash
npx prisma migrate dev
npx prisma generate
```

Verify it connects properly:

```bash
npx prisma studio
```

---

## 5. Run Development Server

```bash
npm run dev
```

The app should now be running at:

```plaintext
http://localhost:3000
```

---

## 6. Folder Structure

```bash
finansaku-be/
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ routes/
│  ├─ controllers/
│  ├─ services/
│  ├─ middlewares/
│  ├─ models/
│  ├─ utils/
│  └─ app.js
├─ .env.example
├─ package.json
├─ README.md
└─ docs/
   ├─ backend-setup.md
   ├─ commit-guide.md
   └─ contribution.md
```

---

## Notes

- Use feature branches (`feat/*`) for new work.
- Keep `main` clean; merge through PRs only.
- Always run migrations before testing changes.
