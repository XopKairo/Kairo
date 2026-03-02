# SYSTEM INTEGRATION MAP

## Overview
This document serves as the verified integration map between the Zora Mobile Application, Backend API, and Admin Panel. All nodes have been checked for stability, correct endpoint routing, and crash prevention.

---

## 1. Mobile App (React Native/Expo)
**Status:** `VERIFIED & STABLE`
- **Base URL:** `https://kairo-b1i9.onrender.com/api`
- **Global Safeguards:** 
  - All `console.log`, `console.warn`, and `console.error` are strictly disabled in production (`!__DEV__`) via `index.js` to prevent UI thread blocking.
  - Immersive `expo-navigation-bar` calls are protected by a mounted `setTimeout` hook.
  - Stack Navigator transitions (e.g., `Login` -> `Register`) are wrapped in `try/catch` with a `'fade'` animation to prevent Android stack crashes.

### Key Flows:
- **Authentication Flow:** 
  - `POST /user/auth/send-otp`
  - `POST /user/auth/verify-otp` (Receives `otp_verified_token`)
  - `POST /user/auth/register` (Uses `otp_verified_token`)
  - `POST /user/auth/login`
- **Wallet & Transactions:**
  - `GET /wallet/balance`
  - `POST /wallet/withdraw`
- **Settings:**
  - `GET /settings`

---

## 2. Backend API (Node.js/Express/MongoDB)
**Status:** `VERIFIED & SECURE`
- **Routing Safety:** All `next()` calls have been strictly removed from the `userAuth.js` route handlers, ensuring no internal 500 loops or unhandled promises during user registration.
- **OTP Logic:** Securely stores OTPs in memory with a strict `expiresAt` validation locked to exactly **10 minutes** (`Date.now() + 10 * 60 * 1000`).
- **Data Integrity:** The `/register` endpoint autonomously cross-verifies the JWT token from the OTP phase. If the user registers as "Female" with a selfie, a `VerificationRequest` is immediately seeded into the database for Admin review.

---

## 3. Admin Panel (Vue.js/Vite)
**Status:** `VERIFIED & CONNECTED`
- **Base URL:** `https://kairo-b1i9.onrender.com/api` (via `.env` -> `VITE_API_URL`)
- **Connection Wrapper:** Uses `fetch-wrapper.ts` for strictly appending the Bearer token and redirecting 401/403 errors to the login screen.

### Key Connections:
- **Master Dashboard & Verification:**
  - `GET /api/verification` -> Fetches all pending host/gender verifications dynamically.
  - `POST /api/verification/:id/status` -> Updates approval state, which reflects on the Mobile App immediately.
- **User Management:**
  - `GET /api/admin/users` -> Real-time user list mirroring DB state.
  - `POST /api/admin/users/:id/ban`
- **Economy & Withdrawals:**
  - `POST /api/wallet/withdraw` processing.

---

## 4. UI & Visual Verification Matrix
| Component | Status | Details |
| :--- | :---: | :--- |
| **Splash Screen** | 🟢 PASS | Enforces a strict 1000ms `Promise.all` timing. |
| **Password Eye Icon** | 🟢 PASS | Uses `isIconLoaded` guard, strict `width: 34`, `height: 34`, and `zIndex: 10`. |
| **OTP Resend Timer** | 🟢 PASS | Uses non-blocking `timerRef` with a reliable 60-second limit. |

## Final Status
[ALL-SYSTEMS-CONNECTED-SUCCESS]