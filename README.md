# 💳 FinanSaku — Core Backend API Service

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-Backend_Framework-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache_&_RateLimit-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)](.github/workflows)

Core REST API service for **FinanSaku**, an automated personal budgeting and regional minimum wage (UMK)-anchored financial planning platform. 

Engineered under the **Coffee Code Community** capstone program.

---

> ⚠️ Developer Note on Documentation & Testing:
> 
> The internal markdown guides inside /docs reflect early architecture drafts and are partially legacy. The active codebase (/src) and Prisma schemas serve as the authoritative single source of truth for current API contracts. Please note that the /__tests__ directory is an abandoned work-in-progress and should not be used as a reference.

---

## 🏛️ System & Infrastructure Architecture

Designed around production readiness, test verification, and low-latency data aggregation:

* **Automated CI/CD Pipelines (`.github/workflows/`):** GitHub Actions workflows handle testing, validation checks (`deploy.yml`), and release staging (`release.yml`).
* **Multi-Tier Caching & Rate-Limiting:** Distributed Redis caching layer prevents redundant database lookups for regional cost-of-living metrics while enforcing endpoint-specific rate thresholds (`express-rate-limit`).
* **Data Aggregation & Adapter Pattern:** Modular adapters ingest, normalize, and reconcile municipal UMK records across fiscal years (`umk.adapter.js`, `livingcost.adapter.js`).
* **Automated Test Coverage:** Integration and unit suites built with Jest covering auth token lifecycles, budget allocation rules, and partial aggregator failure resilience.
* **Dual-Token Authentication Pipeline:** JWT authentication supporting Google OAuth2 federated logins, refresh token rotation, and instant session revocation flags.

---

## 🛠️ Stack

* **Runtime:** Node.js, Express.js
* **Database:** PostgreSQL (Supabase) with Prisma ORM
* **Caching & Session Storage:** Redis
* **Quality Assurance:** Jest, Supertest
* **Observability:** Pino structured JSON logging
* **Process Orchestration:** PM2 + Nginx reverse proxy

---

## 📁 Codebase Layout

```text
finansaku-be/
├── src/
│   ├── config/         # Logger, Redis client, Prisma bootstrap
│   ├── controllers/    # Request dispatchers & status mappers
│   ├── services/       # Core business logic & financial formulas
│   │   └── aggregator/ # Data ingestion adapters & CSV normalizers
│   ├── middlewares/    # JWT guards, role checks, rate limiters
│   └── utils/          # Token cache, crypt, email dispatchers
├── prisma/             # Schema definitions, seeders, and migration history
└── __tests__/          # Automated test specifications

```

---

## 🚀 Local Setup

```bash
# 1. Install packages
npm install

# 2. Configure variables
cp .env.example .env

# 3. Migrate database
npx prisma generate
npx prisma migrate dev

# 4. Run automated tests
npm test

# 5. Launch development server
npm run dev

```

---

## 📜 License & Attribution

Maintained under the **Coffee Code Community** Capstone Program.

© FinanSaku Backend Engineering Team.
