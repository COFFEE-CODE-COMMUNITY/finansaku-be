---
aliases: [google-login-setup]
description: Guide for configuring and testing Google OAuth2 login in FinanSaku backend.
lastUpdated: 2025-10-21
maintainer: FinanSaku Backend Team
---

# Google OAuth2 Setup Guide

This guide explains how to configure Google OAuth2 authentication for the FinanSaku backend and verify that the flow works correctly.

---

## 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services → Credentials**.
3. Select **Create Credentials → OAuth client ID**.
4. Choose **Web application**.
5. Add the following as Authorized Redirect URIs:

```bash
[http://localhost:8081/api/v1/auth/google/callback](http://localhost:8081/api/v1/auth/google/callback)
[https://api.finansaku.com/api/v1/auth/google/callback](https://api.finansaku.com/api/v1/auth/google/callback)
````

---

## 2. Environment Configuration

Add the following variables to `.env`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8081/api/v1/auth/google/callback
CLIENT_WEB_REDIRECT=http://localhost:5173/oauth-success
````

Ensure these values match the settings in Google Cloud Console.

---

## 3. Testing the Flow

### Local Testing

1. Run the backend server:

   ```bash
   NODE_ENV=development npm run dev
   ```

2. Visit:

   ```bash
   http://localhost:8081/api/v1/auth/google/redirect
   ```

3. Complete Google login.
4. The browser should redirect to:

   ```bash
   http://localhost:5173/oauth-success?token=<ACCESS_TOKEN>
   ```

5. Check `refreshToken` cookie in browser → Application → Cookies → `http://localhost:8081`.

### Production Testing

1. Ensure your production environment uses HTTPS.
2. Update `.env` with production redirect URIs.
3. Confirm cookies show `Secure: true` and `SameSite: None`.

---

## 4. Known Issues and Fixes

| Issue                   | Cause                                   | Resolution                                         |
| ----------------------- | --------------------------------------- | -------------------------------------------------- |
| Invalid OAuth state     | Expired or missing state cookie         | Clear browser cookies and retry                    |
| Cookie not saved in dev | `secure: true` on localhost             | Ensure `secure: false` when `NODE_ENV=development` |
| Redirect URI mismatch   | URI doesn’t match Google Console config | Update URI in console to match `.env`              |

---

## 5. Verification Checklist

| Test                   | Expected Result                    |
| ---------------------- | ---------------------------------- |
| OAuth state validation | 400 error on tampered state        |
| New user login         | User record created                |
| Returning user login   | No duplicate records               |
| Cookie creation        | `refreshToken` stored in browser   |
| Token refresh          | New access token generated         |
| Redirect URL           | Redirects to frontend success page |

---

## 6. Maintenance

- Rotate Google client secrets if compromised.
- Test OAuth flow after deployment or domain changes.
- Keep backend `.env.example` up-to-date.
