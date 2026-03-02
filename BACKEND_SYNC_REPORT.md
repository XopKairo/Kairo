# BACKEND SYNC REPORT
**Date:** Tuesday, March 3, 2026
**Scope:** Auth Routing, OTP Delivery Synchronization, and User Creation Logic
**Status:** [AUTH-SYSTEM-FIXED]

## 1. The 'Next' Error Elimination
* **Scan Targets:** `controllers/authController.js` and `routes/userAuth.js`
* **Findings:** The routes previously used standard Express `next` handlers implicitly in Mongoose hooks, but explicit `try...catch` blocks handled the HTTP responses. Some older logic may have thrown Promise rejections without sending JSON.
* **Resolution:** 
  * Verified that all route endpoints strictly use `res.status(500).json({ success: false, message: error.message })` inside their `catch` blocks.
  * Successful account creation in `userAuth.js` now strictly returns `res.status(201).json(...)` to securely signal the HTTP 201 Created state to the client.

## 2. OTP Flow & Sync Audit
* **Issue Discovered:** OTPs were previously stored in a temporary, in-memory `Map` (`otpStore`). This isolated OTP generation from MongoDB, making it entirely invisible to the Admin Panel and prone to loss during server restarts (or serverless scaling on Render).
* **Resolution:** 
  * Created a dedicated `OTP` Mongoose Schema (`models/OTP.js`).
  * Refactored `userAuth.js` to perform `OTP.findOneAndUpdate` and `OTP.findOne`.
  * **Strict 10-Minute Expiry:** The schema establishes an `expiresAt: Date` field calculated precisely at `Date.now() + 10 * 60 * 1000`. A TTL (Time-To-Live) index automatically prunes expired OTPs from the database.
  * **Admin Panel Sync:** Added a secure `GET /api/admin/users/otps` endpoint. The Admin panel can now actively fetch live OTPs from MongoDB for support debugging and user verification.

## 3. Database Write Check
* **Findings:** `User.create(userData)` was reviewed. 
* **Validation:** 
  * The fields `name`, `gender`, `zoraPoints` (defaults to 5), and `coins` (defaults to 0) are correctly extracted from `req.body` and sanitized.
  * If a user registers via phone, it assigns `userData.phone`; if via email, it assigns `userData.email`. Both map directly to the `User.js` schema constraints correctly.
  * A `VerificationRequest` is synchronously generated if the user identifies as 'Female' with an attached selfie payload.

[AUTH-SYSTEM-FIXED]