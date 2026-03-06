# ZegoCloud rules (Specific to minimize size and prevent crashes)
-keep class im.zego.** { *; }
-keep class com.zegocloud.** { *; }
-keep class **.zego.** { *; }
-dontwarn im.zego.**

# Google Ads rules
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }
-keep public class com.google.android.gms.ads.mediation.** { *; }
-keep public class com.google.android.gms.ads.rewarded.** { *; }

# React Native rules
-keep class com.facebook.react.** { *; }
-keep public class com.horcrux.svg.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# General shrinking optimizations
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
}
-keepattributes Signature, Exceptions, *Annotation*
-dontwarn com.facebook.react.**
-dontwarn okhttp3.**
-dontwarn okio.**

# Native symbols for stack traces
-keepattributes SourceFile, LineNumberTable
