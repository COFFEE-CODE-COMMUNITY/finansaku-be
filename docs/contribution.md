---
aliases: [contribution]
description: Collaboration, merge workflow, and team roles guide for the FinanSaku backend team.
lastUpdated: 2025-10-22
maintainer: FinanSaku Backend Team
---

# Collaboration & Merge Workflow

This document describes how the **FinanSaku backend team** collaborates within
the project repository — including branch conventions, pull request practices,
and each member’s role and responsibilities.

---

## 1. Roles & Responsibilities

| **Week** | **Backend A (Core & Infrastructure)**                                                                                                     | **Backend B (API & Integration)**                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **4**    | Setup repository, environment, database, and Prisma migrations                                                                            | Setup Postman workspace and dummy API endpoints for initial integration                     |
| **5**    | Implement authentication system (JWT + Google OAuth2), email verification, and password recovery flows                                    | Build core CRUD endpoints (User, UMK, Saku, Article) and validation schemas                 |
| **6**    | Finalize deployment (VM, Nginx, PM2), user settings (email/password update), aggregator service, and automated testing (Jest + Supertest) | Implement notifications, export-to-CSV, dashboard endpoints, and finalize API documentation |

---

### 1.1 **Backend A – Core & Infrastructure Lead**

**Focus:** System setup, authentication, database, and deployment.
**Main Responsibility:** Ensure the backend _runs properly_ — including database reliability, API security, and deployment infrastructure.

**Tasks:**

- Initialize backend project structure (**Node.js + Express + Prisma**)
- Setup Supabase database and `.env` configuration
- Define Prisma schema, manage migrations, and seeding
- Implement **authentication** (register/login + JWT, refresh tokens)
- Integrate **Google OAuth2 login**
- Implement **email verification** and **password recovery**
- Implement **email/password update** (user settings)
- Handle **UMK and budget allocation logic**
- Manage **Aggregator Service** for UMK & cost-of-living data
- Add **rate limiting & security middlewares**
- Setup **PM2, Nginx, SSL**, and optional **Redis cache**
- Integrate optional **Sentry monitoring**
- Maintain backend documentation and deployment workflows

---

### 1.2 **Backend B – API & Integration Lead**

**Focus:** Functional endpoints, validation, and frontend integration.
**Main Responsibility:** Ensure the frontend _can interact smoothly_ with the backend.

**Tasks:**

- Create API routes for **User**, **UMK**, and **Saku/Allocation**
- Build **Article** endpoints (list, detail, CRUD for admin)
- Implement **Notifications** (CRUD + delivery triggers)
- Implement **data export** (CSV/PDF/Excel)
- Implement **dashboard analytics endpoints**
- Build **Admin** and **Announcement** modules
- Handle **input validation** (Joi/Zod or DTOs)
- Manage **error handling** and response standardization
- Create **integration tests** (Postman, Jest, Supertest)
- Prepare **API documentation** (Swagger or Markdown)
- Maintain **frontend integration support**
- Collaborate on **budget logic and performance**
- Update documentation for any new or modified endpoints

---

## 2. Branch Rules (Manual Enforcement)

Because the GitHub Free plan does not support automatic branch protection rules,
the team enforces the following conventions manually to ensure consistency and
repository safety.

### Branch Restrictions

| Rule | Description |
|------|--------------|
| **No direct commits to `main` or `dev`** | All changes must go through pull requests. |
| **Create feature branches from `dev`** | Use the format `feat/<feature-name>` (e.g., `feat/auth-register`). |
| **Never delete `main` or `dev`** | These branches are permanent and must remain stable. |
| **Always pull the latest `dev`** | Before creating a new branch, run `git pull origin dev`. |
| **Merge via Pull Requests only** | Avoid pushing directly to `main` or `dev`. Use PRs for review. |
| **Keep commits clean** | Use squash or rebase before merging to maintain a linear history. |
| **Delete merged branches** | Remove feature branches after merge to keep the repository tidy. |

---

## 3. Pull Request Rules

| Setting | Description |
|----------|--------------|
| **Require Pull Request for all merges** | All changes must be submitted through a PR. |
| **Minimum 1 reviewer required** | Another backend team member must approve before merging. |
| **Dismiss stale approvals** | New commits invalidate previous approvals. |
| **Resolve all conversations** | No PR may be merged with unresolved comments. |
| **No direct or force pushes** | Prevents overwriting commits in `main` or `dev`. |
| **Use “Squash and Merge”** | Keeps the commit history concise and consistent. |

---

## 4. Example Workflow

```bash
# 1. Stay updated with the latest development branch
git checkout dev
git pull origin dev

# 2. Create a new feature branch
git checkout -b feat/umk-crud

# 3. Work on changes, commit, and push
git add .
git commit -m "feat: add UMK CRUD endpoints"
git push -u origin feat/umk-crud

# 4. Open a Pull Request
# Target: dev branch
# Reviewer: Another backend team member

# 5. After approval and testing
# Merge using "Squash and Merge"
# Then delete the branch after merge
```

---

## 5. Merge Flow Summary

```bash
feat/*  →  dev  →  main
```

| Branch   | Purpose                                    |
| -------- | ------------------------------------------ |
| `feat/*` | Used for developing new features or fixes  |
| `dev`    | Integration branch for testing and staging |
| `main`   | Stable production-ready branch             |

---

## 6. Notes

- Use meaningful branch names (e.g., `feat/announcement-api` instead of
  `feat/new`).
- Keep PRs focused — one logical change per PR.
- Always pull the latest `dev` before starting new work to prevent merge
  conflicts.
- Treat `main` as production-only; merge into it only after thorough testing.
- Always update documentation if your feature adds or modifies core logic.
