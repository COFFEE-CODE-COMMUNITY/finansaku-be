---
aliases: [db-workflow]
description: Prisma and Supabase development workflow guide for the FinanSaku backend team.
lastUpdated: 2025-10-12
maintainer: FinanSaku Backend Team
---
# FinanSaku — Database Workflow Guide

This document describes the workflow used by the **FinanSaku backend team** for
managing the database using **Prisma ORM** and **Supabase PostgreSQL**.

It explains how to create migrations, apply manual SQL constraints, and maintain
schema consistency throughout development.

---

## 1. Overview

FinanSaku uses **Prisma** for schema definition and structural management, while
**manual SQL constraints** are used to enforce business logic and validation
rules.

- **Prisma** manages tables, relations, and indexes.
- **Manual SQL scripts** (in `docs/db_constraints.sql`) handle `CHECK` and other
  advanced constraints.
- All IDs are stored as **UUIDs** (`String @db.Uuid`).
- Tables follow **snake_case** naming in PostgreSQL, while Prisma models use
  **camelCase** via `@map()` annotations.

---

## 2. Migration and Database Commands

### 2.1 Create a new migration

Run this command whenever you add or modify Prisma models or relationships:

```bash
npx prisma migrate dev --name add_article_table
```

This will:

- Generate a new migration under `prisma/migrations/`.
- Apply it to your connected Supabase database.
- Keep versioned migration history for tracking.

---

### 2.2 Reset the database (development only)

Use this when your database becomes out of sync or a migration fails:

```bash
npx prisma migrate reset
```

This command:

- Drops all tables.
- Re-applies every migration from scratch.
- Rebuilds the schema to match your current Prisma models.

> ⚠️ Only use this in **development environments**. Never reset production data.

---

### 2.3 Apply manual constraints

Custom validations such as `CHECK` constraints are defined in:

```bash
docs/db_constraints.sql
```

Apply them using the **`DIRECT_URL`** (which bypasses Prisma’s connection pool):

```bash
psql "$DIRECT_URL" -f docs/db_constraints.sql
```

This operation is **idempotent**, meaning it can be safely re-run at any time.

---

### 2.4 Validate schema and inspect constraints

To verify that your Prisma schema is valid:

```bash
npx prisma validate
```

To list all `CHECK` constraints from the database:

```bash
psql "$DIRECT_URL" -c "
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE conname LIKE 'check_%'
ORDER BY table_name;
"
```

Example output:

```bash
 constraint_name                    | table_name       | definition
------------------------------------+------------------+--------------------------------------------
 check_umk_amount_nonnegative       | umk              | CHECK ((amount >= 0))
 check_notifications_type_valid     | notifications    | CHECK ((type = ANY(ARRAY['reminder','system','survey','budget'])))
 check_admins_role_valid            | admins           | CHECK ((role = ANY(ARRAY['super_admin','system_admin','finance_admin',...])))

(3 rows)
```

---

## 3. Migration Naming Convention

| Prefix    | Example                                 | When to Use                          |
| --------- | --------------------------------------- | ------------------------------------ |
| `add_`    | `add_article_table`                     | Creating a new table or column       |
| `remove_` | `remove_unused_column_in_saku`          | Removing a table or field            |
| `rename_` | `rename_city_field_name`                | Renaming a field or table            |
| `update_` | `update_budgetcategory_percentage_type` | Changing a data type or rule         |
| `fix_`    | `fix_relation_umk_city_uuid`            | Correcting a relation or foreign key |

Each migration should represent **one logical schema change**.

---

## 4. Recommended Development Flow

| Step                   | Command                                         | Description                                        |
| ---------------------- | ----------------------------------------------- | -------------------------------------------------- |
| 1. Edit schema         | —                                               | Modify Prisma models or relationships              |
| 2. Apply migration     | `npx prisma migrate dev --name some_change`     | Generates and applies a new migration              |
| 3. Apply constraints   | `psql "$DIRECT_URL" -f docs/db_constraints.sql` | Runs manual validation rules                       |
| 4. Validate schema     | `npx prisma validate`                           | Ensures schema integrity                           |
| 5. List constraints    | Use SQL query above                             | Displays all `CHECK` constraints                   |
| 6. Reset DB (optional) | `npx prisma migrate reset`                      | Performs a full schema reset for local development |

---

## 5. Reference Files

| File                             | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `prisma/schema.prisma`           | Prisma model definitions           |
| `prisma/migrations/`             | Auto-generated SQL migration files |
| `docs/db_constraints.sql`        | Manual validation constraints      |
| `docs/db-workflow.md`            | This workflow guide                |
| `docs/db-schema.md` *(optional)* | ERD and schema documentation       |

---

## 6. Current Setup Summary

| Item                 | Details                                                          |
| -------------------- | ---------------------------------------------------------------- |
| **Database**         | Supabase PostgreSQL (`aws-1-ap-southeast-1.pooler.supabase.com`) |
| **ORM**              | Prisma — camelCase models, snake_case tables                     |
| **Constraints**      | Applied manually via `psql "$DIRECT_URL"`                        |
| **Latest Migration** | `add_article_table` (2025-10-12)                                 |
| **Schema Check**     | Verified using `npx prisma validate`                             |

---

## 7. Notes

- Always commit both the Prisma schema and its generated migration.
- Re-run constraints after schema changes.
- Keep migration names descriptive and consistent with project conventions.
- Avoid editing generated migration files manually unless absolutely necessary.
