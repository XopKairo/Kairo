export default {
  "expo": {
    "name": "Zora",
    "owner": "ajil1234",
    "slug": "zora",
    "version": "1.0.0",
    "newArchEnabled": false,
    "react-native-google-mobile-ads": {
      "android_app_id": "ca-app-pub-2842532668081504~8477148280",
      "ios_app_id": "ca-app-pub-3940256099942544~1458002511"
    },
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "jsEngine": "hermes",
    "androidStatusBar": {
      "hidden": true,
      "translucent": true
    },
    "androidNavigationBar": {
      "visible": false,
      "backgroundColor": "#00000000"
    },
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "notification": {
      "icon": "./assets/icon.png",
      "color": "#1a1a2e"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.zora.live"
    },
    "android": {
      "package": "com.zora.live",
      "googleServicesFile": process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      "enableGenerateArchitectureSpecificApks": true,
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "MODIFY_AUDIO_SETTINGS",
        "ACCESS_NETWORK_STATE",
        "ACCESS_WIFI_STATE",
        "INTERNET"
      ],
      "adaptiveIcon": {
        "backgroundColor": "#1a1a2e",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      }
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "kotlinVersion": "1.9.25",
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "buildToolsVersion": "35.0.0",
            "newArchEnabled": false,
            "extraGradleProperties": {
              "android.suppressKotlinVersionCompatibilityCheck": "1.9.25",
              "kotlin.suppressKotlinVersionCompatibilityCheck": "1.9.25"
            },
            "kotlinCompilerArgs": [
              "-Xskip-metadata-version-check"
            ]
          }
        }
      ],
      "./plugins/withManifestFix",
      "expo-notifications",
      "expo-image-picker",
      "expo-asset",
      "expo-font",
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-2842532668081504~8477148280",
          "android_app_id": "ca-app-pub-2842532668081504~8477148280",
          "iosAppId": "ca-app-pub-3940256099942544~1458002511"
        }
      ]
    ],
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "42944b55-11a7-49ea-b4ef-93b4807e4f2a"
      }
    }
  },
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-2842532668081504~8477148280",
    "ios_app_id": "ca-app-pub-3940256099942544~1458002511"
  }
};