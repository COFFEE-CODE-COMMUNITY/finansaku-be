---
aliases: [changelog, version-history]
description: Version history and release notes for the FinanSaku backend.
lastUpdated: 2025-10-22
maintainer: FinanSaku Backend Team
---

# Changelog

This file records the release history of the **FinanSaku Backend** project.
All commits follow the [Conventional Commits](./docs/commit-guide.md) standard.

---

## v0.1.0 – 2025-10-22

### Features

- Added JWT-based authentication (access and refresh tokens)
- Implemented Google OAuth2 login
- Added email verification and password recovery flows
- Implemented account management (change email and password)
- Integrated Redis for token caching and verification
- Added mailer utility with HTML templates
- Completed Prisma schema with all core entities and relations

### Infrastructure

- Added structured logging, error handling, and request rate limiter
- Integrated Sentry for optional monitoring
- Configured PM2 and Nginx for production deployment

### Documentation

- Added backend setup, database, and authentication guides
- Updated `.env.example` with Redis and mailer configuration
- Created Postman environment and collection structure

### Pending

- Testing of Redis flows on VM
- Docker Compose setup for local Redis and Postgres
- Addition of API reference for public routes

---

## Versioning

This project follows **semantic versioning (semver)**:

```bash

MAJOR.MINOR.PATCH

```

Example:

- `v1.0.0` – First stable production release
- `v0.1.0` – MVP / development preview

---

## Notes

- Each feature branch merged into `dev` must include an update to this file.
- Releases are tagged and merged from `dev` → `main` after verification.
