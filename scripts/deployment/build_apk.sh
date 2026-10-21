#!/bin/bash
set -e

# ParentCare360: Android APK Build & Sync Utility
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  ParentCare360: Android APK Build & Sync Utility"
echo "=========================================================="

echo "Step 1: Building production web bundle..."
cd frontend
npm run build

echo "Step 2: Syncing bundle to native Android project..."
npx cap sync android

echo "Step 3: Compiling debug APK via Gradle..."
cd android
./gradlew assembleDebug --no-daemon

echo "Step 4: Copying generated APK to output locations..."
cp app/build/outputs/apk/debug/app-debug.apk ../ParentCare360.apk
cp app/build/outputs/apk/debug/app-debug.apk ../../ParentCare360.apk

echo "=========================================================="
echo "✓ Android APK built successfully!"
echo "  Output: ParentCare360.apk"
echo "=========================================================="
