# ParentCare360 — Expo Native Mobile App

This directory (`mobile/`) contains the **Expo / React Native** native application for **ParentCare360**.

It wraps the full-featured, responsive ParentCare360 platform in a native React Native runtime equipped with:
- **Native Android Hardware Back Button Handling** (`BackHandler`): Navigates through tabs, closes active modals, and uses a double-tap safe exit prompt to prevent accidental exits.
- **Expo Go Support:** Scan a QR code from your terminal to run the app live on your physical iOS or Android phone.
- **EAS Build Ready:** Generate installable `.apk` packages directly in the cloud without needing local Android Studio, Java JDK, or Gradle installations.
- **Dynamic Server Switching:** Built-in settings modal to switch between cloud production (`https://parentcare360-web.onrender.com`) and local development IPs (`http://192.168.x.x:5173` or `http://10.0.2.2:5173` for Android Emulator).

---

## 1. Quick Start with Expo Go (Physical Phone)

### Step 1: Install Dependencies
Inside the `mobile/` directory:
```bash
cd mobile
npm install
```

### Step 2: Start the Expo Development Server
```bash
npx expo start
```

### Step 3: Open on Your Device
1. **On Android:**
   - Install **Expo Go** from the Google Play Store.
   - Open Expo Go and tap **Scan QR Code**.
   - Scan the QR code displayed in your terminal.
2. **On iOS:**
   - Install **Expo Go** from the Apple App Store.
   - Open the default iOS **Camera app** and scan the QR code in your terminal.
   - Tap the prompt to open in Expo Go.

---

## 2. Connecting to Local Backend vs. Live Cloud

By default, the Expo app connects to the live production deployment:
```
https://parentcare360-web.onrender.com
```

### Testing Against Your Local Development Machine:
1. Ensure your computer and phone are on the **same Wi-Fi network**.
2. Find your machine's local IP address:
   - On macOS/Linux: `ipconfig getifaddr en0` or `ifconfig`
   - Example: `192.168.1.15`
3. Start the Vite web frontend on your computer:
   ```bash
   cd frontend
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
4. In the mobile app, tap the **⚙️ (Settings)** icon in the top header.
5. Enter: `http://192.168.1.15:5173` (replace with your actual IP) and tap **Connect**.

---

## 3. Building an Installable Android APK with EAS Cloud Build

You do **not** need Android Studio or Java installed locally to compile an APK. You can use **Expo Application Services (EAS)**:

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```
*(This automatically installs `eas-cli` locally inside the project, so you never need sudo or global permissions!)*

### Step 2: Log In to Expo
```bash
npm run login
```
*(Or run `npx --package eas-cli eas login` — sign up for free at [expo.dev](https://expo.dev) if you don't have an account).*

### Step 3: Run the Cloud APK Build
```bash
npm run build:apk
```
*(If prompted: `Would you like to automatically create an EAS project for @manthannayaks/parentcare360?`, press **Y** / Enter).*

EAS compiles the native Android bundle in the cloud and prints a direct download link and QR code to download and install `ParentCare360.apk` onto any Android phone.

---

## 4. Hardware Back Button Behavior

In `mobile/App.js`, native back-button handling is implemented using React Native's `BackHandler`:
- **If a modal is open:** Pressing the Back button closes the modal.
- **If you navigated between tabs:** Pressing Back navigates back to the previous tab or Overview.
- **If you are on the home/overview screen:** Pressing Back once shows a native toast: *"Press back again to exit ParentCare360"*. Pressing Back a second time within 2 seconds cleanly exits the app.

---

## 5. File Structure

```
mobile/
├── App.js              # Native entrypoint: WebView + BackHandler + Status Bar + URL Switcher
├── app.json            # Expo project manifest (permissions, bundle ID, orientation)
├── eas.json            # EAS Build configuration (APK preview profile)
├── babel.config.js     # Babel preset for React Native / Expo
├── package.json        # Expo & React Native dependencies
├── assets/             # Icons, adaptive icons, and splash screens
└── README.md           # This documentation guide
```

