# ROOT CAUSE ANALYSIS - ZORA REGISTRATION & UI ISSUES
**Auditor:** Senior Full-Stack Security Auditor
**Date:** Tuesday, March 3, 2026
**Status:** [SCAN-COMPLETE-ERRORS-FOUND]

## 1. Backend: The 'Next' Error & Route Integrity
### [GHOST DETECTED] Syntax Error Residue
*   **Finding:** The `next is not a function` error reported in previous logs was a direct consequence of a `SyntaxError: Unexpected token '...'` in `controllers/authController.js`. 
*   **Audit Result:** The current version of `authController.js` and `routes/userAuth.js` have been scrubbed of the `...` placeholder.
*   **Remaining Risk:** If the error persists, it is due to **Render Build Caching**. The production environment may still be running an older container layer. 

### [LOGIC GAP] Middleware Flow Control
*   **File:** `backend-mongo/middleware/authMiddleware.js`
*   **Issue:** The `protect` and `protectUser` middleware functions do not `return` after sending an error response in the `catch` block or the `if (!token)` block. 
*   **Risk:** While it doesn't cause a crash currently (due to the `if (!token)` check), it allows the function execution to continue after a response has been sent, which is a violation of Express best practices and can lead to "Headers already sent" errors if the logic grows.

## 2. OTP Delivery & Database State
### [CRITICAL] TTL Index vs. Code Grace Period
*   **File:** `backend-mongo/models/OTP.js` and `routes/userAuth.js`
*   **Mismatch:** A 60-second "grace period" was added to the code logic in `verify-otp`. However, the MongoDB model has a TTL index: `otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });`.
*   **Root Cause:** MongoDB will delete the OTP document exactly at `expiresAt`. If a user submits an OTP 1 second after `expiresAt`, the document will be GONE from the database. The server-side code will find `null` and return "OTP not requested or expired", making the 60s grace period in the code **completely unreachable**.

## 3. Mobile-App: Registration Logic & UI
### [SILENT FAILURE] API Parameter Mismatch
*   **Audit Result:** Mobile `api.js` correctly maps `phone` and `email` based on the `isPhone` boolean. Parameters (name, phone, gender) match the backend `User` schema.
*   **Silent Crash Point:** In `UserRegisterScreen.js`, the registration success alert requires a manual user click (`OK`) to trigger `navigation.replace('Login')`. If the app environment (or a bug in `react-native-paper`/`expo-linear-gradient`) prevents the alert from rendering, the user is stuck on the loading state indefinitely.

### [UI BUG] Full-Screen / Immersive Mode
*   **File:** `mobile-app/App.js`
*   **Issue:** `SystemUI.setBackgroundColorAsync('transparent')` and `NavigationBar.setVisibilityAsync('hidden')` are being called, but they are not awaited. 
*   **Result:** On some Android devices (like iQOO Neo 10), the system UI may re-assert itself during the heavy splash-to-login transition, causing the navigation bar to reappear or flicker.

## 4. Connectivity & Sync
### [NETWORK RISK] Strict CORS Whitelist
*   **File:** `backend-mongo/server.js`
*   **Constraint:** CORS is locked to `['https://kairo-admin.vercel.app', 'https://kairo-sooty.vercel.app']`. 
*   **Observation:** If the mobile app is being tested via a web browser (web build) or a local tunnel that doesn't mask the origin, the API requests will be blocked by the browser's CORS policy, leading to a silent failure where the loading spinner never stops.

[SCAN-COMPLETE-ERRORS-FOUND]
