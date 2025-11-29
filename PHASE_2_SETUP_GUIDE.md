# Phase 2 Mobile Development - Installation & Setup Guide

## 📦 Install Required Packages

First, install all the Capacitor plugins needed for mobile features:

```powershell
npm install @capacitor/camera @capacitor/push-notifications @capacitor/network @capacitor/preferences @capacitor-community/barcode-scanner
```

## 🔥 Firebase Setup (Push Notifications)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `lenzro-saas`
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Add Android App to Firebase

1. Click "Add app" → Android icon
2. Enter Android package name: `com.lenzro.app` (must match `capacitor.config.ts`)
3. Enter app nickname: `Lenzro`
4. Download `google-services.json`
5. Place it in: `d:\After School Work\Lenzro SaaS\android\app\`

### 3. Enable Cloud Messaging

1. In Firebase Console, go to "Project Settings" → "Cloud Messaging"
2. Under "Cloud Messaging API (Legacy)", enable it
3. Copy the "Server Key" - you'll need this for backend

### 4. Get Firebase Config

1. Go to "Project Settings" → "General"
2. Scroll down to "Your apps" → Web app
3. Click "Config" to see your Firebase configuration
4. Copy the values to your `.env` file:

```env
# Firebase Configuration (Phase 2 - Push Notifications)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

### 5. Get VAPID Key (for Web Push)

1. In Firebase Console → "Project Settings" → "Cloud Messaging"
2. Under "Web Push certificates", click "Generate key pair"
3. Copy the key to `VITE_FIREBASE_VAPID_KEY` in `.env`

## 📱 Configure Android Permissions

Update `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Existing permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Camera permissions (Phase 2) -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature
    android:name="android.hardware.camera"
    android:required="false"
  />
    
    <!-- Network status (Phase 2) -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Push notifications (Phase 2) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <application
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
  >
        
        <!-- ... existing activities ... -->
        
    </application>
</manifest>
```

## 🎨 Add Barcode Scanner Styles

Add to `src/index.css`:

```css
/* Barcode Scanner Animation */
@keyframes scan {
  0% {
    top: 0;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

.animate-scan {
  animation: scan 2s ease-in-out infinite;
}

/* Hide content when barcode scanner is active */
.barcode-scanner-active {
  visibility: hidden;
  --background: transparent;
  --ion-background-color: transparent;
}

.barcode-scanner-active .scanner-ui {
  visibility: visible;
}
```

## 🔌 Initialize Services in App

Update `src/App.tsx`:

```tsx
import { useEffect } from "react";
import { notificationService } from "./services/notifications";
import { offlineService } from "./services/offline";
import OfflineIndicator from "./components/OfflineIndicator";

function App() {
  useEffect(() => {
    // Initialize push notifications
    notificationService.initialize();

    // Initialize offline service
    offlineService.initialize();

    return () => {
      notificationService.cleanup();
    };
  }, []);

  return (
    <>
      {/* Offline indicator at top */}
      <OfflineIndicator />

      {/* Your existing app content */}
      {/* ... */}
    </>
  );
}

export default App;
```

## 🗄️ Add Notification Tokens Table

Run this in Supabase SQL Editor:

```sql
-- Create table for storing FCM tokens
CREATE TABLE IF NOT EXISTS notification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own tokens
CREATE POLICY "Users manage own tokens"
  ON notification_tokens
  FOR ALL
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_notification_tokens_user ON notification_tokens(user_id);
CREATE INDEX idx_notification_tokens_org ON notification_tokens(organization_id);
CREATE INDEX idx_notification_tokens_token ON notification_tokens(token);
```

## 🏗️ Sync Capacitor

After installing plugins and configuring, sync to Android:

```powershell
npm run android:sync
```

## ✅ Test on Physical Device

1. Connect Android device via USB
2. Enable USB debugging on device
3. Open Android Studio: `npm run android`
4. Click "Run" in Android Studio

### Test Checklist:

- [ ] Camera permission prompt appears
- [ ] Barcode scanner opens full-screen
- [ ] Scanner can read barcodes
- [ ] Offline indicator shows when airplane mode on
- [ ] Changes queue when offline
- [ ] Sync button appears when back online
- [ ] Push notification permission prompt
- [ ] Token saved to database

## 🚨 Common Issues

### Camera Permission Denied

- Manually grant camera permission in device settings
- Go to Settings → Apps → Lenzro → Permissions → Camera

### Barcode Scanner Black Screen

- Make sure `google-services.json` is in correct location
- Check AndroidManifest.xml has camera permissions
- Restart app after first permission grant

### Push Notifications Not Working

- Verify Firebase setup is complete
- Check `google-services.json` package name matches `capacitor.config.ts`
- Test on physical device (not emulator)

### Offline Sync Not Triggering

- Toggle airplane mode to test
- Check browser console for errors
- Verify Network plugin is installed: `npx cap sync`

## 📝 Next Steps

1. ✅ Install Capacitor plugins
2. ✅ Set up Firebase project
3. ✅ Configure Android permissions
4. ✅ Add notification_tokens table
5. ✅ Initialize services in App.tsx
6. ✅ Test on physical device
7. ⏳ Implement backend notification sending (Phase 3)
8. ⏳ Add PayPal integration (Phase 3)
9. ⏳ Complete testing (Phase 4)
10. ⏳ Deploy to Play Store (Phase 5)

## 📚 Documentation References

- [Capacitor Camera](https://capacitorjs.com/docs/apis/camera)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Capacitor Network](https://capacitorjs.com/docs/apis/network)
- [Capacitor Preferences](https://capacitorjs.com/docs/apis/preferences)
- [Barcode Scanner Plugin](https://github.com/capacitor-community/barcode-scanner)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
