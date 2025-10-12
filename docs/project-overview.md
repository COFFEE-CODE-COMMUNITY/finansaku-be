---
aliases: [project-overview]
description: Project overview for the FinanSaku backend project.
lastUpdated: 2025-10-12
maintainer: FinanSaku Backend Team
---
# FinanSaku Backend — Project Overview

Welcome to the **FinanSaku Backend** documentation.

This backend powers **FinanSaku**, a regional personal finance management web
application that helps users manage their salary allocations based on **UMK
(minimum wage)** and personalized spending personas.
It is built using **Express.js**, **Prisma**, and **PostgreSQL**, and integrated
with **Supabase** for cloud database hosting.

---

## 1. Overview

| Item | Description |
|------|--------------|
| **Language** | JavaScript (Node.js) |
| **Framework** | Express.js |
| **Database ORM** | Prisma |
| **Database** | PostgreSQL (Supabase) |
| **Package Manager** | npm |
| **Environment** | `.env` managed via `dotenv` |
| **Version Control** | Git + GitHub (Coffee Code Community Organization) |

---

## 2. Repository Structure (Simplified)

```bash
finansaku-be/
├─ prisma/               # Prisma schema and migrations
├─ src/                  # Application source code
│  ├─ routes/            # Route definitions
│  ├─ controllers/       # Request handlers
│  ├─ services/          # Business logic
│  ├─ middlewares/       # Middleware utilities
│  └─ app.js             # Entry point
├─ docs/                 # Documentation
│  ├─ backend-setup.md
│  ├─ commit-guide.md
│  ├─ contribution.md
│  └─ db-workflow.md
├─ .env.example
├─ package.json
└─ README.md
```

---

## 3. Development Flow

1. Create a new branch from `dev` for any new feature:

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/<feature-name>
   ```

2. Commit following **Conventional Commits** guidelines (see
   [`docs/commit-guide.md`](./commit-guide.md)).

3. Push your branch and open a **Pull Request** targeting `dev`.

4. After testing and review, merge `dev` → `main` for production release.

---

## 4. Documentation Index

| File                                     | Description                                   |
| ---------------------------------------- | --------------------------------------------- |
| [`backend-setup.md`](./backend-setup.md) | Environment setup and local development guide |
| [`commit-guide.md`](./commit-guide.md)   | Conventional commit message format            |
| [`contribution.md`](./contribution.md)   | Collaboration, branching, and merge workflow  |
| [`db-schema.md`](./db-schema.md)         | Database structure and relationships          |
| [`db-workflow.md`](./db-workflow.md)     | Prisma migration and constraint workflow      |

---

## 5. Next Steps

| Stage             | Task                                                               |
| ----------------- | ------------------------------------------------------------------ |
| **Setup**         | Base folder, environment, and Git workflow completed               |
| **Development**   | Implement authentication (`feat/auth-register`, `feat/auth-login`) |
| **Integration**   | Connect backend with Supabase PostgreSQL                           |
| **Documentation** | Add API reference and deployment guide                             |

---

## 6. Notes

- All new code contributions should go through a **feature branch** and **PR
  review**.
- Always run database migrations before testing backend modules.
- Keep documentation updated as new modules or database changes are introduced.
