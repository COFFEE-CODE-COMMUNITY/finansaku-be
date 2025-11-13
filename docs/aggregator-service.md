---
aliases: [aggregator-service]
description: External data aggregation and synchronization guide for UMK and living-cost data in the FinanSaku backend.
lastUpdated: 2025-11-07
maintainer: FinanSaku Backend Team
---

# FinanSaku — Aggregator Service Guide

This document explains how the **Aggregator Service** in FinanSaku fetches, reconciles, and stores data for:

- **UMK (Regional Minimum Wage)** — Manual import (Kemnaker / BPS dataset)
- **Living Cost Index** — Automatic from BPS (IHK) + fallback from Kaggle dataset

The service uses native **`fetch()`** — no Axios, no heavy dependencies — ensuring it’s VM-friendly and portable.

---

## 1. Overview

The Aggregator ensures the backend always has the latest economic reference data for accurate calculations in the **Saku** module.

### 1.1 Core Capabilities

- Built-in **Node.js Fetch API**
- Multi-source auto-fetch + manual import
- Automatic retries with exponential backoff
- Idempotent DB upsert to `umk` and `living_cost`
- Sync audit trail via `aggregator_logs`
- Supports both **cron** and **manual trigger**
- Safe fallback when Redis or API is offline

---

## 2. Data Flow

```mermaid
flowchart TD
    A[External Sources<br>Kemnaker / BPS / Kaggle] --> B[Aggregator Service]
    B --> C[Reconciliation Layer<br>Merge • Validate • Decide]
    C --> D[(Optional Cache — Redis)]
    D --> E[(Database — PostgreSQL<br>Tables: umk, living_cost)]
    E --> F[Saku Module<br>Uses UMK + Living Cost for allocation]
    B -. Manual Trigger .-> G[/GET /system/aggregator/sync?type=/]
    B -. Cron Trigger .-> H[node-cron Scheduler]
    H --> B
````

---

## 3. Implementation Details

### 3.1 Data Fetching

| Item               | Description                                        |
| ------------------ | -------------------------------------------------- |
| **HTTP Client**    | Native `fetch()`                                   |
| **Timeout**        | 10s (via `AbortController`)                        |
| **Retries**        | 3 attempts, exponential delay                      |
| **Sources**        | BPS IHK (auto), Kaggle (manual), UMK JSON (manual) |
| **Format**         | JSON / CSV auto-detect                             |
| **Error Handling** | Skips failed source, logs warning                  |

### 3.2 Reconciliation Logic

| Case              | Handling                             |
| ----------------- | ------------------------------------ |
| Minor differences | Average values → high confidence     |
| Large gaps        | Weighted variance → lower confidence |
| No success        | Fallback to last known DB values     |

### 3.3 Database Writes

All writes are **idempotent** with Prisma `upsert()`.

| Table             | Description                           |
| ----------------- | ------------------------------------- |
| `umk`             | Minimum wage per city/year            |
| `living_cost`     | IHK / cost-of-living index            |
| `aggregator_logs` | Sync log (source, status, confidence) |

### 3.4 Caching

- Redis is **optional**.
- Set `ENABLE_REDIS=false` to disable cleanly (no crashes).
- Caches `last_sync` timestamp when enabled.

### 3.5 Cron Job

```env
AGGREGATOR_ENABLE_CRON=true
AGGREGATOR_CRON_EXPRESSION=0 3 1 * *  # Every 1st day of the month at 03:00
```

- Scheduler: `src/jobs/aggregator.cron.js`
- When `AGGREGATOR_ENABLE_CRON=false`, scheduler is skipped (used in tests).

### 3.6 Manual Sync Endpoint

| Method | Path                                              | Purpose                  |
| ------ | ------------------------------------------------- | ------------------------ |
| GET    | `/api/v1/system/aggregator/sync?type=umk`         | Manual UMK JSON import   |
| GET    | `/api/v1/system/aggregator/sync?type=living_cost` | Manual CPI / Kaggle sync |

**Response:**

```json
{
  "success": true,
  "message": "Aggregator living_cost sync completed"
}
```

> Tip: Add `?dryRun=true` (if implemented) to inspect decisions without writing.

---

## 4. Prisma Models

```prisma
model LivingCost {
  id        String   @id @default(uuid()) @map("id_living_cost") @db.Uuid
  cityId    String   @map("city_id") @db.Uuid
  year      Int
  index     Decimal  @map("index") @db.Decimal(8, 2)
  currency  String   @default("IDR") @db.VarChar(10)
  sourceUrl String?  @map("source_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  city City @relation(fields: [cityId], references: [id])
  @@unique([cityId, year])
  @@map("living_cost")
}

model AggregatorLog {
  id           String   @id @default(uuid()) @map("id_aggregator_log") @db.Uuid
  cityId       String?  @map("city_id") @db.Uuid
  year         Int?
  type         String   @db.VarChar(20)
  chosenSource String?  @map("chosen_source") @db.VarChar(100)
  confidence   Decimal? @db.Decimal(5, 2)
  status       String   @default("success") @db.VarChar(20)
  message      String?  @db.VarChar(255)
  createdAt    DateTime @default(now()) @map("created_at")

  city City? @relation(fields: [cityId], references: [id])
  @@map("aggregator_logs")
}
```

---

## 5. Testing

> **Test profile (Jest)**
> Set in `jest.setup.js`:
>
> - `NODE_ENV=test`
> - `ENABLE_REDIS=false` (skip Redis paths safely)
> - `AGGREGATOR_ENABLE_CRON=false` (avoid background jobs)

| Test                 | Status | Notes                                                                              |
| -------------------- | ------ | ---------------------------------------------------------------------------------- |
| fetch mock           | ✅      | Falls back to merged mock if remote fetch fails                                    |
| reconciliation       | ✅      | Averages + confidence scoring covered                                              |
| UMK manual sync      | ✅      | Reads local mocked dataset in tests                                                |
| living cost sync     | ✅      | `fetchAllSources()` + upserts                                                      |
| cron trigger         | ✅/~    | Cron registration & trigger simulated; add failure-path assertions for robustness  |
| partial API failures | ~      | Add table-driven cases: some sources fail, some succeed, verify chosen source/logs |

---

## 6. Future Improvements

- Weighted trust scores per source
- Historical snapshots of raw API responses
- Notification system on failed sync
- Optional provincial roll-up aggregation

---

## 7. Notes

- Entire logic runs inside Express — no separate daemon
- Redis is non-blocking (safe to disable)
- Errors never crash the core app
- Update source constants in `aggregator.service.js` once final public APIs are confirmed
