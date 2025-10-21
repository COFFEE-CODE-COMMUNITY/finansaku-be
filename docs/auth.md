---
aliases: [auth, oauth, google-oauth]
description: Guide for implementing and testing authentication in FinanSaku.
lastUpdated: 2025-10-21
maintainer: FinanSaku Backend Team
---

# Authentication & Google OAuth2 Guide

This document describes how authentication works in **FinanSaku**, including JWT-based login and Google OAuth2 integration.

---

## 1. Overview

FinanSaku uses **JWT tokens** for session management and supports **Google OAuth2 login** for simplified user authentication.
When a user signs in using Google, their verified email is stored in the database, and they receive both access and refresh tokens.

---

## 2. JWT Token Structure

| Token | Purpose | Storage | Expiry |
|-------|----------|----------|--------|
| **Access Token** | Authorize API requests | Frontend memory / header | 1 hour |
| **Refresh Token** | Renew access tokens | HTTP-only cookie | 7 days |

Tokens are generated using environment secrets:

```env
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRES=1h
REFRESH_TOKEN_EXPIRES=7d
```

> The refresh token is stored securely in a cookie with `httpOnly`, `secure`, and `sameSite` attributes enabled.

---

## 3. Google OAuth2 Integration

### 3.1 Google Cloud Setup

1. Go to **[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)**
2. Create a new **OAuth 2.0 Client ID**:

   - Application Type: **Web Application**
   - Authorized Redirect URIs:

     ```bash
     http://localhost:8081/api/v1/auth/google/callback
     https://api.finansaku.space/api/v1/auth/google/callback
     ```

3. Copy the generated Client ID and Secret, then add them to `.env`:

   ```env
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   GOOGLE_REDIRECT_URI=http://localhost:8081/api/v1/auth/google/callback
   CLIENT_WEB_REDIRECT=http://localhost:5173/oauth-success
   ```

---

## 4. Backend Flow

**Routes:**

```js
GET /api/v1/auth/google
GET /api/v1/auth/google/callback
GET /api/v1/auth/me
```

**Process:**

1. User clicks “Login with Google”.
2. Frontend calls `/auth/google`.
3. Backend redirects to Google’s OAuth2 consent screen.
4. Google redirects back to `/auth/google/callback` with an authorization `code`.
5. Backend exchanges the code for Google tokens.
6. User info (`email`, `name`, `picture`) is fetched and upserted into the database.
7. Backend issues JWTs, stores refresh cookie, and redirects to:

   ```bash
   http://localhost:5173/oauth-success?accessToken=<token>
   ```

---

## 5. OAuth State Parameter (CSRF Protection)

To prevent CSRF attacks, a **state** cookie is used:

```js
const state = crypto.randomUUID()
res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax' })
```

During callback:

```js
if (req.query.state !== req.cookies.oauth_state) throw new Error('Invalid state')
res.clearCookie('oauth_state')
```

---

## 6. Prisma User Model (OAuth-Ready)

```prisma
model User {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @db.VarChar(100)
  username        String   @unique @db.VarChar(50)
  email           String   @unique @db.VarChar(100)
  emailVerifiedAt DateTime? @map("email_verified_at")
  password        String?
  profileImage    String?  @map("profile_image")
  provider        String?
  providerId      String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
}
```

> For Google users, `provider` = `"google"` and `providerId` = Google account ID.

---

## 7. Testing the Flow (Manual)

| Scenario                 | Expected Result                                |
| ------------------------ | ---------------------------------------------- |
| **New User Login**       | New user record with provider info             |
| **Returning User Login** | No duplicates, existing record updated         |
| **Invalid State**        | 400 error, “Invalid state”                     |
| **Cookies**              | `httpOnly`, `secure`, `sameSite=none` verified |
| **Token Rotation**       | New refresh token per login                    |

**Manual test:**

```bash
npm run dev
open http://localhost:8081/api/v1/auth/google
```

---

## 8. Postman Testing Setup

### 8.1 Collection Structure

```bash
FinanSaku
├── Auth
│   └── Me (GET)
└── OAuth
    ├── Health Check (GET)
    ├── Google Redirect (GET)
    └── Google Callback (GET)
```

### 8.2 Environments

| Variable              | Example Value                                       |
| --------------------- | --------------------------------------------------- |
| `base_url`            | `http://localhost:8081`                             |
| `google_redirect_uri` | `http://localhost:8081/api/v1/auth/google/callback` |
| `frontend_redirect`   | `http://localhost:5173/oauth-success`               |

### 8.3 Export Steps

1. **Collection:**

   - Hover over `FinanSaku` → `...` → **Export** → Format `2.1`
   - Save as `docs/postman/FinanSaku.postman_collection.json`

2. **Environments:**

   - Click ⚙️ → **Manage Environments**
   - Select `FinanSaku (Local)` → click **Download ⬇️**
   - Save as `docs/postman/environments/FinanSaku Local.postman_environment.json`

### 8.4 How to Import

1. Open Postman → **Import → Upload Files**
2. Import both:

   - `FinanSaku.postman_collection.json`
   - `FinanSaku Local.postman_environment.json`

3. Select the environment → click **Send** on:

   - `GET /health` → expect `{ "status": "ok" }`
   - `GET /auth/google` → expect 302 redirect to Google
   - `GET /auth/me` → returns user info after successful login

---

## 9. Troubleshooting

| Issue                    | Cause                | Fix                       |
| ------------------------ | -------------------- | ------------------------- |
| 400 invalid_grant        | Redirect mismatch    | Check Google Console URIs |
| Invalid state            | CSRF mismatch        | Ensure cookies enabled    |
| No token                 | Missing JWT env vars | Verify `.env`             |
| jwt.io invalid signature | Secret not entered   | Paste secret manually     |

---

## 10. Future Plans

- Add more OAuth2 provider
- Extend docs for frontend OAuth flow
