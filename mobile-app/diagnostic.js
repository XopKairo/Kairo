#!/usr/bin/env node

/**
 * EAS Native Build Diagnostic CLI
 * For Zora / Kairo project (React Native 0.76 + Expo 52)
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log("\n🛠️  EAS Build Diagnostic CLI Starting...\n");

// Step 1: Check Android SDK / Gradle Versions
try {
    const gradleVersion = execSync('./android/gradlew -v').toString();
    console.log("✅ SDK & Gradle Info:\n", gradleVersion.split('\n').slice(0,5).join('\n'));
} catch (_e) {
    console.error("❌ Could not detect SDK or Gradle. Make sure Android SDK is installed locally.");
}

// Step 2: List Native Dependencies
console.log("\n🔍 Listing native dependencies...");
try {
    const deps = execSync('./android/gradlew app:dependencies').toString();
    console.log(deps.split('\n').filter(line => line.includes('---') || line.includes('com.google')).join('\n'));
} catch(_e) {
    console.error("❌ Failed to fetch dependencies. Run './gradlew app:dependencies' manually.");
}

// Step 3: Check for common conflicts
console.log("\n⚠️ Checking for potential conflicts (ZegoCloud + Google Ads)...");

const conflictDeps = [
    'com.google.android.gms',
    'androidx.appcompat',
    'androidx.core',
    'im.zego'
];

conflictDeps.forEach(dep => {
    if (fs.existsSync(`android/app/build.gradle`)) {
        const content = fs.readFileSync('android/app/build.gradle', 'utf-8');
        if (!content.includes(dep)) {
            console.log(`⚡ Suggestion: Force compatible version for ${dep} in android/build.gradle`);
        }
    }
});

// Step 4: Suggest Gradle / SDK updates
console.log("\n💡 Suggested Fixes:");
console.log("1. Ensure compileSdkVersion = 35, targetSdkVersion = 35 in app/build.gradle");
console.log("2. Ensure buildToolsVersion = '35.0.0'");
console.log("3. Add resolutionStrategy in android/build.gradle to force dependency versions");
console.log("4. Clear EAS cache: eas build --clear-cache");
console.log("5. Add ProGuard rules for ZegoCloud and Google Ads if minification enabled");

// Step 5: Optional: fix script (manual confirmation)
console.log("\n🚀 CLI diagnostic completed. Review suggestions and apply fixes as needed.\n");