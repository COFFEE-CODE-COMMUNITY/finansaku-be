# FinanSaku Backend

> Status: Active Development (v0.1.0)

Backend service for **FinanSaku**, a budgeting and UMK-based financial tracker app by **Coffee Code Community**.

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
- **Redis** for token, caching, and rate-limit store (optional in local)
- **JWT Authentication**
- **Nodemailer** for email templates
- **Pino** for structured logging
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
│  ├─ utils/            # Helpers / utilities (cache, token helpers)
│  ├─ config/           # Env, logger (Pino), Redis client
│  ├─ app.js            # Express app (middlewares + routes)
│  └─ server.js         # HTTP server bootstrap (app.listen)
├─ .env.example         # Example environment variables
├─ package.json
├─ README.md
└─ docs/                # Project documentation
```

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

```bash
# Create a new feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feat/feature-name

# Commit and push your changes
git add .
git commit -m "feat: add Saku CRUD endpoints"
git push -u origin feat/feature-name
```

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

## Monitoring & Logging

The backend uses **Pino** for structured logging.

- Dev: pretty, human-readable logs (`LOG_PRETTY=true`)
- Prod: JSON logs to STDOUT (managed by **PM2**; rotated via **pm2-logrotate**)

Key envs:

```bash
LOG_LEVEL=info
LOG_PRETTY=true
LOG_WITH_REQ_ID=true
LOG_REDACT=password,authorization,access_token,refresh_token
```

---

## Security & Rate Limiting

Global and authentication-specific rate limiters are configured via **express-rate-limit**.

### Environment Variables

```bash
RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=10
RATE_LIMIT_WINDOW_MS=60000
```

### Optional Redis Persistence

To enable distributed rate limiting and caching:

```bash
ENABLE_REDIS=true
REDIS_URL=redis://:password@127.0.0.1:6379
```

Health check endpoint:

```bash
GET /api/v1/health  # returns uptime + Redis status (healthy|unreachable|disabled)
```

---

## License

This project is maintained under the **Coffee Code Community** capstone program.
© 2025 Coffee Code Community — FinanSaku Backend Team
For inquiries or collaboration, please contact the backend maintainers.
