# FinanSaku Backend – Project Overview

Welcome to the **FinanSaku Backend** documentation.
This backend powers FinanSaku — a regional personal finance management app built
with **Express**, **Prisma**, and **PostgreSQL**.

---

## Overview

| Item | Description |
|------|--------------|
| **Language** | JavaScript (Node.js) |
| **Framework** | Express.js |
| **Database ORM** | Prisma |
| **Database** | PostgreSQL / Supabase |
| **Package Manager** | npm |
| **Environment** | `.env` managed with `dotenv` |
| **Version Control** | Git + GitHub (Coffee Code Community Org) |

---

## Repository Structure

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
├─ docs/
│  ├─ backend-setup.md
│  ├─ commit-guide.md
│  └─ contribution.md
├─ .env.example
├─ package.json
└─ README.md
```

---

## Development Flow

1. All new features → create branch from `dev`

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/<feature-name>
   ```

2. Commit following **Conventional Commits** (`docs/commit-guide.md`)
3. Push and open PR → `dev`
4. After testing, merge `dev` → `main` for production release.

---

## Documentation Index

| File | Description |
|------|--------------|
| [`backend-setup.md`](./backend-setup.md) | Environment setup, dependencies, and project run guide |
| [`commit-guide.md`](./commit-guide.md) | Conventional commit message rules |
| [`contribution.md`](./contribution.md) | Branching, PR, and merge workflow guide |

---

## Next Steps

| Stage | Task |
|--------|------|
| **Setup** | Base folders, environment, and Git strategy completed |
| **Development** | Implement authentication (`feat/auth-register`, `feat/auth-login`) |
| **Integration** | Connect to Supabase PostgreSQL |
| **Documentation** | Add API reference and deployment steps |
