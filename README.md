# FinanSaku Backend

> Status: Active Development (v0.1.0)

Backend service for **FinanSaku**, a budgeting and UMK-based financial tracker
app by **Coffee Code Community**.

---

## Overview

FinanSaku backend provides:

- User authentication and authorization (JWT + Google OAuth2)
- Email verification and password recovery
- Account management (change email & password)
- UMK and salary data management
- Automated budget allocation logic
- Article and announcement management
- RESTful API for dashboard and frontend integration

---

## Tech Stack

- **Node.js** with **Express**
- **Prisma ORM**
- **PostgreSQL** (Supabase)
- **Redis** for token and verification caching
- **JWT Authentication**
- **Nodemailer** for email templates
- **PM2 + Nginx** for deployment (`api.finansaku.space`)

---

## Folder Structure

```bash
finansaku-be/
├─ prisma/              # Prisma schema & migrations
├─ src/
│  ├─ routes/           # Express route definitions
│  ├─ controllers/      # Handles API logic
│  ├─ services/         # Business logic
│  ├─ middlewares/      # Auth / validation middleware
│  ├─ models/           # (Optional) non-Prisma data models
│  ├─ utils/            # Helpers / utilities
│  └─ app.js            # Main server entry
├─ .env.example         # Example environment variables
├─ package.json
├─ README.md
└─ docs/                # Project documentation
````

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Run in development mode
npm run dev
```

---

## Database (Prisma)

```bash
# Generate Prisma client
npx prisma generate

# Run local migrations
npx prisma migrate dev
```

To view your database in Prisma Studio:

```bash
npx prisma studio
```

Supabase PostgreSQL is used for remote production deployment.

---

## Branch & Commit Conventions

- Commits follow [Conventional Commits](./docs/commit-guide.md)
- Branch flow:

  - `main` → stable, production-ready branch
  - `dev` → active development branch
  - `feat/*` → feature branches for new work (e.g. `feat/auth-login`)

### Example Workflow

1. Create a new feature branch from `dev`

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/feature-name
   ```

2. Commit and push your changes

   ```bash
   git add .
   git commit -m "feat: add Saku CRUD endpoints"
   git push -u origin feat/feature-name
   ```

3. Open a Pull Request targeting `dev`

4. After review and testing, merge `dev` → `main`

---

## Documentation

Refer to the [`/docs`](./docs) directory for full details:

| File                                                    | Description                               |
| ------------------------------------------------------- | ----------------------------------------- |
| [`backend-setup.md`](./docs/backend-setup.md)           | Local setup and environment configuration |
| [`auth.md`](./docs/auth.md)                             | Authentication, JWT, and OAuth2 guide     |
| [`db-workflow.md`](./docs/db-workflow.md)               | Prisma migration and Supabase workflow    |
| [`db-schema.md`](./docs/db-schema.md)                   | Database structure and relationships      |
| [`db-testing.md`](./docs/db-testing.md)                 | Database verification and CRUD testing    |
| [`google-login-setup.md`](./docs/google-login-setup.md) | Google OAuth2 configuration guide         |
| [`commit-guide.md`](./docs/commit-guide.md)             | Conventional commit message rules         |
| [`contribution.md`](./docs/contribution.md)             | Collaboration and merge workflow          |
| [`project-overview.md`](./docs/project-overview.md)     | General overview and architecture         |
| [`CHANGELOG.md`](./CHANGELOG.md)                        | Version history and release notes         |
| [`db_erd.png`](./docs/db_erd.png)                       | Database ERD diagram                      |

---

## License

This project is maintained under the **Coffee Code Community** capstone program.
© 2025 Coffee Code Community — FinanSaku Backend Team
For inquiries or collaboration, please contact the backend maintainers.
