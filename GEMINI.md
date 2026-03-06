# Zora Project Technical Mandates

This file contains the foundational configuration required for successful builds and app stability for the Zora/Kairo project. **DO NOT CHANGE THESE SETTINGS** unless specifically requested, as they are proven to work.

## Core Configuration
- **Ads Version:** `react-native-google-mobile-ads: 14.2.2` (Selected for build stability and launch crash prevention in SDK 52).
- **New Architecture:** `newArchEnabled: false` (Must remain false to avoid Codegen/NativeAppModuleSpec errors).
- **Kotlin Version:** `1.9.25` (Required for compatibility with current dependencies).
- **EAS Owner:** `ajilomalloor77`
- **EAS Project ID:** `7c0bb517-c5d6-4ce7-9c19-afad7984df8b`
- **GitHub User:** `XopKairo`

## Build Optimizations
- **App Size:** `enableProguardInReleaseBuilds: true` and `enableShrinkResourcesInReleaseBuilds: true` are enabled to reduce APK size from 200MB+ to ~40-60MB.
- **ABI Splitting:** `enableGenerateArchitectureSpecificApks: true` is set in `app.config.js`.

## Code Stability
- **Ads Initialization:** Always wrap `mobileAds().initialize()` in a `try-catch` block in `App.js` to prevent launch-time crashes.

## Project Structure
- **Admin Panel:** Uses `zora.png` as favicon and sidebar logo.
- **Mobile Assets:** Brand logo `zora.png` is used for `icon.png`, `splash-icon.png`, and adaptive icons.
