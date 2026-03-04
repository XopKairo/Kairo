export default {
  "expo": {
    "name": "Zora",
    "owner": "omalloorajil",
    "slug": "zora",
    "version": "1.0.0",
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
      "versionCode": 1,
      "googleServicesFile": process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      "enableProguardInReleaseBuilds": true,
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
      "expo-notifications",
      "expo-image-picker",
      "expo-asset",
      "expo-font",
      [
        "expo-build-properties",
        {
          "android": {
            "kotlinVersion": "1.9.24",
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "buildToolsVersion": "34.0.0",
            "newArchEnabled": false
          }
        }
      ],
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
        "projectId": "0a5a5301-5383-43ce-89df-b8869ca083aa"
      }
    }
  }
};
