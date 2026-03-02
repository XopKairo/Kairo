export default {
  "expo": {
    "name": "Zora",
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
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#050505"
    },
    "notification": {
      "icon": "./assets/icon.png",
      "color": "#8A2BE2"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.zora.live"
    },
    "android": {
      "package": "com.zora.live",
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
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      }
    },
    "plugins": [
      "expo-notifications",
      "expo-asset",
      "expo-font",
      [
        "expo-build-properties",
        {
          "android": {
            "kotlinVersion": "1.9.25",
            "newArchEnabled": false
          }
        }
      ],
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-3940256099942544~3347511713",
          "android_app_id": "ca-app-pub-3940256099942544~3347511713",
          "iosAppId": "ca-app-pub-3940256099942544~1458002511"
        }
      ]
    ],
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "e60fc663-b454-4068-a3ab-9ee38551aff4"
      }
    }
  }
};
