---
aliases: [infrastructure, monitoring, rate-limiting, redis, logging]
description: Configuration and setup guide for logging, monitoring, rate limiting, and Redis integration in the FinanSaku backend.
lastUpdated: 2025-10-23
maintainer: FinanSaku Backend Team
---

# Infrastructure & Monitoring Guide

This document explains how to configure the **infrastructure, logging, monitoring, and caching** systems used in the FinanSaku backend.

---

## 1. Rate Limiting & Security

The backend uses **express-rate-limit** to control incoming traffic and protect against brute-force or spam attacks.

### 1.1. Files

| File | Description |
|------|--------------|
| `src/middlewares/rateLimiter.js` | Defines global and authentication-specific rate limiters |
| `src/app.js` | Registers rate limiter middleware |
| `.env` | Stores rate limit configuration variables |

### 1.2. Configuration

Example `.env` variables:

```bash
# === Rate Limiting ===
RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=10
RATE_LIMIT_WINDOW_MS=60000
```

### 1.3. Behavior

- Global rate limit applies to all requests (default: 100 requests per minute per IP).
- Authentication routes have a stricter rate limit (default: 10 requests per 15 minutes).
- Blocklisted IPs can be added to the `blocklistedIPs` set in `rateLimiter.js`.

---

## 2. Logging & Error Handling

The backend uses **Winston** for structured logging and **custom error handling middleware** for consistent API responses.

### 2.1. Files

| File                              | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| `src/config/logger.js`            | Defines Winston logger configuration                            |
| `src/middlewares/errorHandler.js` | Centralized error handler that logs and formats error responses |
| `.env`                            | Configurable log level and directory path                       |

### 2.2. Configuration

Example `.env`:

```bash
# === Logging ===
LOG_LEVEL=debug
LOG_DIR=logs
```

### 2.3. Behavior

- Logs are saved to `logs/error.log` and `logs/combined.log`.
- The logger automatically creates the directory if it does not exist.
- Console output is colorized for local development.
- Error details include timestamp, status code, message, and stack trace.
- All unhandled exceptions are logged by the global error handler.

---

## 3. Sentry Monitoring

**Sentry** is integrated for runtime error monitoring in production environments.

### 3.1 Files

| File              | Description                                       |
| ----------------- | ------------------------------------------------- |
| `src/app.js`      | Initializes Sentry and registers handlers         |
| `.env.production` | Contains the Sentry DSN for production monitoring |

### 3.2 Configuration

```bash
# === Sentry ===
SENTRY_DSN=https://<your_sentry_key>@oXXXXXX.ingest.sentry.io/XXXXXXX
```

### 3.3 Behavior

- Sentry initialization only runs when `SENTRY_DSN` is provided.
- It automatically tracks uncaught exceptions and rejected promises.
- Works alongside Winston for local and file-based logging.

---

## 4. Redis Integration

Redis is used for **token caching, session storage, and rate limit persistence**.
If Redis is unavailable (e.g., when the VM is not yet deployed), the app logs a warning and continues without crashing.

### 4.1 Files

| File                       | Description                                                  |
| -------------------------- | ------------------------------------------------------------ |
| `src/config/redis.js`      | Initializes Redis client and connection handling             |
| `.env` / `.env.production` | Stores Redis connection credentials                          |
| `src/app.js`               | Imports the Redis client to initialize connection on startup |

### 4.2 Configuration

Example `.env`:

```bash
# === Redis ===
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379
```

### 4.3 Behavior

- Automatically connects on startup if Redis is available.
- Displays a warning if Redis connection fails in local mode.
- Reconnects automatically when the service becomes available.
- Used internally for caching, rate-limit persistence, and token verification.

---

## 5. Deployment Preparation

Before deploying to the production VM, ensure the following components are configured:

| Component      | Description                                   |
| -------------- | --------------------------------------------- |
| **PM2**        | Handles process management and auto-restart   |
| **Nginx**      | Provides HTTPS reverse proxy and routing      |
| **Redis**      | Enables caching and rate-limiting persistence |
| **Sentry DSN** | Monitors runtime errors in production         |

### Recommended Steps

1. Install Node.js, PM2, and Nginx on the VM.
2. Copy `.env.production` to the server and verify credentials.
3. Configure SSL and reverse proxy on `api.finansaku.space`.
4. Verify Sentry logging and Redis connection from logs.
5. Confirm that rate limiting and error logs behave as expected.

---

## Notes

- Redis and Sentry integrations are optional in local development.
- Logging, rate limiting, and error handling work without external dependencies.
- Deployment configuration will be extended once the VM environment is available.
- See `/docs/backend-setup.md` for local setup instructions and `/docs/db-schema.md` for database structure.
