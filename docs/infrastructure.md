---
aliases: [infrastructure, monitoring, rate-limiting, redis, logging]
description: Configuration and setup guide for logging, monitoring, rate limiting, and Redis integration in the FinanSaku backend.
lastUpdated: 2025-11-06
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
````

### 1.3. Behavior

- Global rate limit applies to all requests (default: 100 requests per minute per IP).
- Authentication routes have a stricter rate limit (default: 10 requests per 15 minutes).
- Blocklisted IPs can be added to the `blocklistedIPs` set in `rateLimiter.js`.

---

## 2. Logging & Error Handling

The backend uses **Pino** for structured logging (replacing Winston) and a **custom global error handler** for consistent API responses.

### 2.1. Files

| File                              | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| `src/config/logger.js`            | Defines Pino logger configuration                               |
| `src/middlewares/errorHandler.js` | Centralized error handler that logs and formats error responses |
| `.env`                            | Configurable log level, pretty mode, and redaction paths        |

### 2.2. Configuration

Example `.env`:

```bash
# === Logging ===
LOG_LEVEL=info
LOG_PRETTY=true
LOG_WITH_REQ_ID=true
LOG_REDACT=password,authorization,access_token,refresh_token
```

### 2.3. Behavior

- Human-readable logs in development, structured JSON in production.
- Sensitive fields are automatically redacted.
- Request IDs (`reqId`) can be injected for correlation in logs.
- PM2 handles file rotation via **pm2-logrotate**.
- To view logs on the VM:

  ```bash
  pm2 logs finansaku --lines 200
  ```

---

## 3. Redis Integration

Redis is used for **token caching**, **rate-limit storage**, and **general caching**.
If Redis is unavailable (e.g., during local dev), the backend logs a warning but continues running safely.

### 3.1. Files

| File                          | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `src/config/redis.js`         | Initializes Redis client and manages connection state       |
| `src/utils/tokenCache.js`     | Generates and consumes temporary tokens (e.g. verification) |
| `src/utils/cache.js`          | (Optional) Generic key-value cache helper for app data      |
| `src/routes/health.routes.js` | Health route for Redis and uptime checks                    |
| `.env` / `.env.production`    | Stores Redis connection credentials                         |

### 3.2. Configuration

Example `.env`:

```bash
# === Redis ===
ENABLE_REDIS=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=yourpassword
REDIS_URL=redis://:yourpassword@127.0.0.1:6379
```

### 3.3. Behavior

- Automatically connects on startup when `ENABLE_REDIS=true`.
- Logs “✅ Redis ready” when connected, or warnings if unreachable.
- Health probe verifies connection on boot (`fs:probe` key).
- Safe fallback: features (cache, rate-limit) gracefully degrade when Redis is offline.
- `GET /api/v1/health` displays Redis status (`healthy`, `unreachable`, or `disabled`).

---

## 4. Deployment Preparation

Before deploying to the production VM, ensure the following components are configured:

| Component     | Description                                   |
| ------------- | --------------------------------------------- |
| **PM2**       | Handles process management and log rotation   |
| **Nginx**     | Provides HTTPS reverse proxy and routing      |
| **Redis**     | Enables caching and rate-limiting persistence |
| **Pino Logs** | Structured logs for debugging and monitoring  |

### Recommended Steps

1. Install Node.js, PM2, and Nginx on the VM.
2. Copy `.env.production` to the server and verify credentials.
3. Configure SSL and reverse proxy on `api.finansaku.space`.
4. Verify Redis connection and log output after restart.
5. Confirm that rate limiting and error logs behave as expected.

---

## Notes

- Redis integration is **optional** for local development.
- Logging, rate limiting, and error handling work without external dependencies.
- Health checks are available at `/api/v1/health` for monitoring uptime.
- See `/docs/backend-setup.md` for local setup and `/docs/db-schema.md` for database details.
