# ZORA FULL TECHNICAL SPECIFICATION & FORENSIC AUDIT REPORT
Date: Monday, March 2, 2026
Status: [FORENSIC-SCAN-COMPLETE]

## 1. BACKEND-MONGO (SYSTEM CORE)

### Mongoose Schemas (models/)
- **User.js**: User data (name, email/phone, password, gender, zoraPoints, coins). Includes 'matchPassword' for auth.
- **Admin.js**: Admin credentials and login OTP storage.
- **VerificationRequest.js**: Handles host selfies, ID URLs, and approval status (pending/approved).
- **Call.js / Message.js**: Logs for video calls and chat history.
- **Transaction.js**: Financial records for coin purchases and withdrawals.

### Critical Functions (controllers/ & routes/)
- **verifyOTP (userAuth.js)**: Verifies phone/email using JWT tokens. The 'next()' call is removed to prevent crashes.
- **register (userAuth.js)**: Creates new users. Correctly saves 'gender' to the database.
- **coinTransaction (wallet.js)**: Updates wallet balances and syncs with the DB instantly.
- **Socket.io Connection**: Handled in 'server.js' for real-time chat and online status tracking.

## 2. ADMIN PANEL (COMMAND CENTER)

### Feature Audit (Vue/Vite)
- **Dashboard.vue**: API-connected counters for users, hosts, and revenue.
- **HostVerification.vue**: Approves or rejects hosts. Updates 'VerificationRequest' status in MongoDB.
- **Economy/CoinManagement**: Live management of user coins.
- **Production Sync**: All axios calls use the production Render URL. Localhost links are removed.

## 3. MOBILE-APP (USER INTERFACE)

### Component Analysis
- **ZoraSplashScreen.js**: Splash timing hard-coded to **1000ms** (1 second).
- **UserRegisterScreen.js**: 
  - **Password Eye Icon**: Managed via 'showPassword' state to toggle secureTextEntry.
  - **OTP Snackbar**: Uses 'react-native-paper' Snackbar for a 2s bottom-anchor notification.
  - **Gender Pass**: Selected gender is sent in the registration request.
- **Firebase/Manifest**: Package 'com.zora.live' matches across google-services.json and AndroidManifest.xml.

## 4. CROSS-MODULE CONNECTIVITY

### Dependency Map
- **Mobile -> Backend**: Communicates via api.js using axios for all auth and feature requests.
- **Admin -> Backend**: Secure admin routes fetch real-time data from the same MongoDB.
- **Orphaned Code**: Legacy Kairo references and registration-time verification steps are purged.

## 5. THE 'BROKEN' LIST (FIXED & VERIFIED)
- [FIXED] 'next is not a function' registration crash.
- [FIXED] 5-second Splash screen delay (now 1s).
- [FIXED] google-services.json missing in EAS builds (now a Secret).
- [FIXED] Host verification moved from Register to Profile Settings.

[FORENSIC-SCAN-COMPLETE]
