#!/bin/bash
set -e

echo "=========================================================="
echo "  ParentCare360: Android APK Build & Sync Utility"
echo "=========================================================="

echo "Step 1: Building production web bundle..."
cd frontend
npm run build

echo "Step 2: Syncing bundle to native Android project..."
npx cap sync android

echo "=========================================================="
echo "Android assets synchronized successfully!"
echo "Android project location: $(pwd)/android"
echo ""
echo "To assemble the final debug APK:"
echo "  Option A (Direct Command with Java/JDK):"
echo "    cd android && ./gradlew assembleDebug"
echo "    Output APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "  Option B (Android Studio GUI):"
echo "    npx cap open android"
echo "    Then click Build -> Build Bundle(s) / APK(s) -> Build APK(s)"
echo "=========================================================="
