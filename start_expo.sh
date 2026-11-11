#!/bin/bash
set -e

echo "=========================================================="
echo "  ParentCare360: Expo Mobile Development Runner"
echo "=========================================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/mobile"

if [ ! -d "node_modules" ]; then
  echo "Installing Expo dependencies..."
  npm install
fi

echo "Starting Expo development server..."
echo "Scan the QR code below using Expo Go on your phone!"
echo "=========================================================="
npx expo start

