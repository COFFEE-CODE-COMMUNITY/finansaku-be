---
aliases: [db-testing]
description: Local and remote database testing checklist for FinanSaku backend.
lastUpdated: 2025-10-12
maintainer: FinanSaku Backend Team
---
# FinanSaku — Database Testing Guide

This document describes how to verify database integrity and ensure schema, seed
data, and migrations are correctly synchronized between **local development**
and the **Supabase cloud environment**.

---

## 1. Purpose

The goal of this testing process is to:

- Validate successful database connection (local and remote)
- Ensure Prisma migrations are applied correctly
- Verify seeded data consistency
- Test CRUD functionality using Prisma Client
- Confirm schema synchronization between environments

---

## 2. Connection Verification

### 2.1 Local Database (optional)

If using a local PostgreSQL instance:

```bash
psql "postgresql://postgres:password@localhost:5432/finansaku"
```

Expected result: successful connection to the local `finansaku` database.

### 2.2 Supabase Cloud Database

Use the **DIRECT_URL** for administrative operations:

```bash
psql "$DIRECT_URL" -c "\dt public.*"
```

Expected output: a list of tables such as `users`, `cities`, `umk`, `saku`, etc.

If you prefer testing Supabase connectivity through Node.js instead of the
`psql` command, you can use `tests/dbTest.js`:

```bash
node tests/test-db.js
```

**Expected output:**

- Lists all public tables (e.g. `users`, `cities`, `umk`, `saku`, etc.)
- Shows both `DIRECT_URL` and `DATABASE_URL` values.

If it prints the table list, your Supabase connection is confirmed to be working.

---

## 3. Migration Validation

Ensure all migrations are successfully applied:

```bash
npx prisma migrate status
```

You should see output similar to:

```bash
Database schema is up to date!
```

If any mismatch is reported, re-apply migrations:

```bash
npx prisma migrate dev
```

---

## 4. Seeding Verification

### 4.1 Run the seed script

```bash
node prisma/seed.js
```

Expected output:

```bash
🌱 Starting FinanSaku seed...
✅ Seed completed successfully.
```

If any error occurs (e.g., constraint violation), check
`docs/db_constraints.sql` for rule conflicts.

### 4.2 Verify seed data

Open **Prisma Studio** to inspect the database visually:

```bash
npx prisma studio
```

Then check:

| Table                  | Verification                                                    |
| ---------------------- | --------------------------------------------------------------- |
| `users`                | One or more sample users exist                                  |
| `cities`               | “Bandung” and other base cities are present                     |
| `umk`                  | Contains valid (year, amount, city_id) entries                  |
| `allocation_templates` | Persona data (e.g., `student`, `freelancer`) inserted correctly |

---

## 5. CRUD Functionality Test

Run a local script to test basic create/read/update/delete operations:

```bash
node tests/crudTest.js
```

Expected console output:

```bash
✅ Created new city: Bandung
✅ Created UMK entry for 2025
✅ Created new user
✅ Queried user data successfully
✅ Updated record
✅ Deleted test entry
```

This ensures Prisma Client works and the connection strings are valid.

---

## 6. Schema Consistency Check

After migrations and seed verification, compare the local schema with Supabase:

```bash
npx prisma validate
```

If both environments are consistent, the result will be:

```bash
✔ The schema is valid
```

For manual verification, run this SQL query on both environments:

```bash
SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
ORDER BY table_name;
```

The lists should match.

---

## 7. Constraint Verification

Run manual constraint checks to confirm validations are active:

```bash
psql "$DIRECT_URL" -c "
SELECT conname AS constraint_name,
       conrelid::regclass AS table_name,
       pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE conname LIKE 'check_%'
ORDER BY table_name;
"
```

Expected sample results:

| Constraint                                | Table              | Definition                                                                     |
| ----------------------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| `check_umk_amount_nonnegative`            | `umk`              | `CHECK ((amount >= 0))`                                                        |
| `check_saku_allocations_percentage_valid` | `saku_allocations` | `CHECK ((percentage >= 0 AND percentage <= 100))`                              |
| `check_admins_role_valid`                 | `admins`           | `CHECK ((role = ANY(ARRAY['super_admin','system_admin','finance_admin',...]))` |

---

## 8. Troubleshooting

| Issue                            | Possible Cause                         | Solution                                              |
| -------------------------------- | -------------------------------------- | ----------------------------------------------------- |
| Connection fails                 | Invalid `DIRECT_URL` or SSL settings   | Re-check `.env` and confirm credentials from Supabase |
| Migration error                  | Schema mismatch or outdated file       | Run `npx prisma migrate reset`                        |
| Seed fails                       | Violates manual constraint             | Verify constraint logic in `docs/db_constraints.sql`  |
| Prisma Studio not showing tables | Migration not applied or incorrect URL | Run `npx prisma db pull`                              |

---

## 9. Completion Checklist

| Task                                     | Status |
| ---------------------------------------- | ------ |
| Database connected locally and remotely  |        |
| Migrations applied successfully          |        |
| Constraints verified in Supabase         |        |
| Seed data inserted and visible           |        |
| CRUD test passed via `crudTest.js`      |        |
| Schema validated (`npx prisma validate`) |        |

> - ✅ Passed — when you’ve verified it works
> - ⚠️ Partial — when it works locally but not on VM
> - ❌ Failed — when it didn’t pass yet

---

## 10. Notes

- Always test database changes locally before syncing to Supabase.
- Rerun constraints after every major schema modification.
- Keep seed data minimal and reusable for consistent testing.
- For remote testing, prefer Supabase SQL Editor or CLI for manual inspection.
