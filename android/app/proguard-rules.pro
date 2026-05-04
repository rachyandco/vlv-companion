# Project-specific ProGuard rules. RN, Hermes, Reanimated, react-native-svg,
# Expo Modules, and MapLibre each ship `consumerProguardFiles` so most keep
# rules arrive automatically; the lines below are belt-and-braces for libraries
# whose published rules have historically been incomplete.

# React Native's @DoNotStrip / @KeepGettersAndSetters annotations mark classes
# and members reached only via JNI; without these keep rules they get stripped.
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.proguard.annotations.KeepGettersAndSetters *;
}

# Hermes / JSI native bridge.
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# New architecture (Fabric + TurboModules). Consumer rules in 0.79 cover most
# of these but the codegen-emitted JNI bridge classes vary by library.
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Reanimated.
-keep class com.swmansion.reanimated.** { *; }

# react-native-screens.
-keep class com.swmansion.rnscreens.** { *; }

# react-native-gesture-handler.
-keep class com.swmansion.gesturehandler.** { *; }

# react-native-svg.
-keep class com.horcrux.svg.** { *; }

# MapLibre native (Mapbox-compat package names too).
-keep class org.maplibre.** { *; }
-keep class com.mapbox.** { *; }

# Expo modules core + autolinked modules.
-keep class expo.modules.** { *; }
-keep class expo.core.** { *; }

# OkHttp / Okio (used by RN's underlying networking).
-dontwarn okhttp3.**
-dontwarn okio.**

# Readable stack traces in release crash reports.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
