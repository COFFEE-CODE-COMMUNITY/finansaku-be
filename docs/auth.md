---
aliases: [auth, oauth, google-oauth, email-verification, password-recovery]
description: Guide for implementing authentication, email verification, and password recovery in FinanSaku.
lastUpdated: 2025-10-22
maintainer: FinanSaku Backend Team
---

# Authentication & Account Flow Guide

This document describes how authentication works in **FinanSaku**, including JWT-based login, Google OAuth2 integration, email verification, and password recovery.

---

## 1. Overview

FinanSaku uses **JWT tokens** for session management and supports **Google OAuth2 login** for simplified user authentication.
When a user signs in or registers, they receive both access and refresh tokens.
Unverified users are restricted from login until their email is activated.

---

## 2. JWT Token Structure

| Token | Purpose | Storage | Expiry |
|-------|----------|----------|--------|
| Access Token | Authorize API requests | Frontend memory / header | 1 hour |
| Refresh Token | Renew access tokens | HTTP-only cookie | 7 days |

Tokens are generated using environment secrets:

```env
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRES=1h
REFRESH_TOKEN_EXPIRES=7d
````

> The refresh token is stored securely in a cookie with `httpOnly`, `secure`, and `sameSite` attributes enabled.

---

## 3. Google OAuth2 Integration

### 3.1 Google Cloud Setup

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)

2. Create a new OAuth 2.0 Client ID:

   - Application Type: Web Application
   - Authorized Redirect URIs:

     ```bash
     http://localhost:8081/api/v1/auth/google/callback
     https://api.finansaku.space/api/v1/auth/google/callback
     ```

3. Copy the generated credentials and add them to `.env`:

   ```env
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GOOGLE_REDIRECT_URI=http://localhost:8081/api/v1/auth/google/callback
   CLIENT_WEB_REDIRECT=http://localhost:5173/oauth-success
   ```

---

## 4. Backend Flow

**Routes:**

```bash
GET /api/v1/auth/google
GET /api/v1/auth/google/callback
GET /api/v1/auth/me
```

**Process:**

1. User clicks “Login with Google”.
2. Backend redirects to Google’s OAuth2 consent screen.
3. Google redirects to `/auth/google/callback` with an authorization `code`.
4. Backend exchanges the code for Google tokens.
5. User info (`email`, `name`, `picture`) is fetched and upserted.
6. Backend issues JWTs, stores refresh cookie, and redirects to frontend success page.

---

## 5. OAuth State Parameter (CSRF Protection)

To prevent CSRF attacks, a `state` cookie is generated and validated during callback.

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

## 6. Email Verification

### 6.1 Flow Summary

| Step | Endpoint                               | Description                                   |
| ---- | -------------------------------------- | --------------------------------------------- |
| 1    | `POST /auth/register`                  | Register user and generate verification token |
| 2    | `GET /auth/verify-email?token=<token>` | Verify user email                             |
| 3    | `GET /auth/resend-verification`        | Resend verification email if not yet verified |

Verification tokens are stored in Redis with a 15–30 minute expiry.
Once verified, the `emailVerifiedAt` field in the database is updated.

---

### 6.2 Email Template

Email templates are stored in `/src/templates/emails/verify-email.html` and use dynamic variables:

```html
<p>Hello {{name}},</p>
<p>Please verify your FinanSaku account by clicking the link below:</p>
<a href="{{verificationLink}}">Verify Email</a>
<p>This link will expire in 30 minutes.</p>
```

---

## 7. Password Recovery

### 7.1 Flow Summary

| Step | Endpoint                     | Description                         |
| ---- | ---------------------------- | ----------------------------------- |
| 1    | `POST /auth/forgot-password` | Generate reset token and send email |
| 2    | `POST /auth/reset-password`  | Validate token and set new password |

Reset tokens are stored in Redis with a 15–30 minute expiry.
Used tokens are invalidated immediately after a successful password reset.

---

### 7.2 Email Template

Stored in `/src/templates/emails/reset-password.html`:

```html
<p>Hello {{name}},</p>
<p>We received a request to reset your FinanSaku password.</p>
<a href="{{resetLink}}">Reset Password</a>
<p>If you didn’t request this, you can safely ignore this email.</p>
```

---

## 8. Account Management

### 8.1 Change Email

| Step | Endpoint                                    | Description                                         |
| ---- | ------------------------------------------- | --------------------------------------------------- |
| 1    | `PATCH /user/change-email`                  | Request email change (requires session or password) |
| 2    | `GET /auth/confirm-new-email?token=<token>` | Confirm change via email link                       |

A verification token is sent to the new email.
On confirmation, the system updates the `email` and `emailVerifiedAt` fields and invalidates existing sessions.

---

### 8.2 Change Password

| Step | Endpoint                      | Description                                   |
| ---- | ----------------------------- | --------------------------------------------- |
| 1    | `PATCH /user/change-password` | Verify current password and update to new one |
| 2    | —                             | All refresh tokens revoked post-update        |

---

## 9. Prisma User Model (OAuth & Verification Ready)

```prisma
model User {
  id              String    @id @default(uuid()) @db.Uuid
  name            String
  username        String    @unique
  email           String    @unique
  password        String?
  provider        String?   @default("local")
  providerId      String?
  emailVerifiedAt DateTime?
  profileImage    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

## 10. Testing with Postman

Create the following folders in your Postman collection:

```bash
FinanSaku
├── Auth
│   ├── Register (POST)
│   ├── Login (POST)
│   ├── Me (GET)
│   └── Refresh (POST)
├── Email Verification
│   ├── Verify Email (GET)
│   └── Resend Verification (GET)
├── Password Recovery
│   ├── Forgot Password (POST)
│   └── Reset Password (POST)
└── Account
    ├── Change Email (PATCH)
    └── Change Password (PATCH)
```

Use `base_url` and `frontend_redirect` variables in your Postman environment to avoid hardcoding URLs.

---

## 11. Troubleshooting

| Issue              | Cause                         | Fix                                          |
| ------------------ | ----------------------------- | -------------------------------------------- |
| Email not received | SMTP misconfiguration         | Check `MAILER_HOST`, `MAILER_USER`, and logs |
| Token expired      | Token TTL exceeded            | Request a new token                          |
| Unverified login   | User not verified             | Verify email or resend verification          |
| Invalid token      | Token already used or revoked | Regenerate token                             |

---

## 12. Future Plans

- Add account deletion endpoint
- Support for multi-provider OAuth login
- Add admin-controlled verification resends
