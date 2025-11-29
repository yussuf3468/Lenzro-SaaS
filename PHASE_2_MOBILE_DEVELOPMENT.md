# 📱 Phase 2: Mobile App Development Guide

## Overview

Enhance your Capacitor setup with mobile-optimized screens, push notifications, and offline support.

---

## Part 1: Mobile-Optimized UI Components

### 1.1 Create Mobile Navigation

Create `src/mobile/components/MobileNav.tsx`:

```typescript
import React from "react";
import { Home, Package, ShoppingCart, Settings, User } from "lucide-react";

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const tabs = [
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "inventory", icon: Package, label: "Products" },
    { id: "sales", icon: ShoppingCart, label: "Sales" },
    { id: "settings", icon: Settings, label: "Settings" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? "scale-110" : ""
                } transition-transform`}
              />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

### 1.2 Mobile Login Screen

Create `src/mobile/screens/MobileLogin.tsx`:

```typescript
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function MobileLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      alert("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4 safe-area">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to continue</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <button className="text-indigo-600 hover:underline text-sm">
              Forgot Password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 1.3 Add Safe Area Support

Update `src/index.css`:

```css
/* Safe area support for mobile devices */
@supports (padding: max(0px)) {
  .safe-area {
    padding-top: max(env(safe-area-inset-top), 0px);
  }

  .safe-area-bottom {
    padding-bottom: max(env(safe-area-inset-bottom), 0px);
  }

  .safe-area-full {
    padding-top: max(env(safe-area-inset-top), 0px);
    padding-bottom: max(env(safe-area-inset-bottom), 0px);
    padding-left: max(env(safe-area-inset-left), 0px);
    padding-right: max(env(safe-area-inset-right), 0px);
  }
}

/* Improve touch targets for mobile */
@media (max-width: 768px) {
  button {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## Part 2: Push Notifications with Firebase

### 2.1 Setup Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project or use existing
3. Add Android app with package name: `com.alkalam.bookshop`
4. Download `google-services.json` and place in `android/app/`

### 2.2 Install Capacitor Push Notifications

```bash
npm install @capacitor/push-notifications
npx cap sync
```

### 2.3 Configure Android

Add to `android/app/build.gradle`:

```gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

Add to `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Add to bottom of `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 2.4 Implement Push Notifications

Create `src/utils/pushNotifications.ts`:

```typescript
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "../lib/supabase";

export const initPushNotifications = async () => {
  // Request permission
  const permission = await PushNotifications.requestPermissions();

  if (permission.receive === "granted") {
    // Register with FCM
    await PushNotifications.register();
  }

  // Listen for registration
  await PushNotifications.addListener("registration", async (token) => {
    console.log("Push token:", token.value);

    // Save token to database
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_profiles")
        .update({ fcm_token: token.value })
        .eq("id", user.id);
    }
  });

  // Listen for incoming notifications
  await PushNotifications.addListener(
    "pushNotificationReceived",
    (notification) => {
      console.log("Push received:", notification);
      // Show custom notification UI
    }
  );

  // Listen for notification tap
  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      console.log("Push action:", action);
      // Navigate to relevant screen
    }
  );
};

export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `key=${import.meta.env.VITE_FIREBASE_SERVER_KEY}`,
    },
    body: JSON.stringify({
      to: fcmToken,
      notification: { title, body },
      data,
    }),
  });

  return response.json();
};
```

### 2.5 Send Notifications from Backend

Create Supabase Edge Function `send-notification`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { userId, title, body, data } = await req.json();

  // Get user's FCM token
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("fcm_token")
    .eq("id", userId)
    .single();

  if (profile?.fcm_token) {
    // Send notification via FCM
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${Deno.env.get("FIREBASE_SERVER_KEY")}`,
      },
      body: JSON.stringify({
        to: profile.fcm_token,
        notification: { title, body },
        data,
      }),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: "No FCM token" }), {
    status: 400,
  });
});
```

---

## Part 3: Offline Support

### 3.1 Install Local Storage

```bash
npm install @capacitor/storage
npx cap sync
```

### 3.2 Create Offline Manager

Create `src/utils/offlineManager.ts`:

```typescript
import { Storage } from "@capacitor/storage";

export const saveOfflineData = async (key: string, value: any) => {
  await Storage.set({
    key,
    value: JSON.stringify({
      data: value,
      timestamp: Date.now(),
    }),
  });
};

export const getOfflineData = async (key: string) => {
  const { value } = await Storage.get({ key });
  if (value) {
    const parsed = JSON.parse(value);
    return parsed.data;
  }
  return null;
};

export const clearOfflineData = async (key: string) => {
  await Storage.remove({ key });
};

// Queue for pending operations
export const queueOfflineAction = async (action: any) => {
  const queue = (await getOfflineData("pending_actions")) || [];
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  await saveOfflineData("pending_actions", queue);
};

export const processPendingActions = async () => {
  const queue = (await getOfflineData("pending_actions")) || [];

  for (const action of queue) {
    try {
      // Process action (e.g., sync sale, update product)
      await processAction(action);

      // Remove from queue
      const updated = queue.filter((a: any) => a.id !== action.id);
      await saveOfflineData("pending_actions", updated);
    } catch (error) {
      console.error("Failed to process action:", error);
    }
  }
};

async function processAction(action: any) {
  // Implement based on action type
  switch (action.type) {
    case "create_sale":
      // Sync sale to Supabase
      break;
    case "update_product":
      // Update product in Supabase
      break;
  }
}
```

### 3.3 Detect Network Status

```typescript
import { Network } from "@capacitor/network";

export const initNetworkListener = async () => {
  const status = await Network.getStatus();
  console.log("Network status:", status);

  Network.addListener("networkStatusChange", (status) => {
    console.log("Network changed:", status);

    if (status.connected) {
      // Process pending offline actions
      processPendingActions();
    }
  });
};
```

### 3.4 Offline Indicator Component

Create `src/mobile/components/OfflineIndicator.tsx`:

```typescript
import React, { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Network } from "@capacitor/network";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkNetwork = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };

    checkNetwork();

    const listener = Network.addListener("networkStatusChange", (status) => {
      setIsOnline(status.connected);
    });

    return () => {
      listener.remove();
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 z-50 safe-area">
      <WifiOff className="w-5 h-5" />
      <span className="font-medium text-sm">
        You're offline. Changes will sync when connected.
      </span>
    </div>
  );
}
```

---

## Part 4: Mobile-Specific Features

### 4.1 Haptic Feedback

```typescript
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export const triggerHaptic = async (
  style: ImpactStyle = ImpactStyle.Medium
) => {
  await Haptics.impact({ style });
};

// Use on button clicks
<button
  onClick={() => {
    triggerHaptic();
    handleAction();
  }}
>
  Click Me
</button>;
```

### 4.2 Camera Integration (for product photos)

```bash
npm install @capacitor/camera
```

```typescript
import { Camera, CameraResultType } from "@capacitor/camera";

export const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
  });

  return image.dataUrl;
};
```

### 4.3 Barcode Scanner (for inventory)

```bash
npm install @capacitor-community/barcode-scanner
```

```typescript
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";

export const scanBarcode = async () => {
  await BarcodeScanner.checkPermission({ force: true });
  BarcodeScanner.hideBackground();

  const result = await BarcodeScanner.startScan();

  if (result.hasContent) {
    return result.content;
  }

  return null;
};
```

---

## Testing Mobile Features

### Android Testing

```bash
npm run android
```

### iOS Testing (requires Mac)

```bash
npx cap open ios
```

### Test Offline Mode

1. Enable Airplane Mode on device
2. Perform actions (create sale, update product)
3. Disable Airplane Mode
4. Verify actions sync automatically

---

## Performance Optimization

1. **Lazy load images**

```typescript
<img loading="lazy" src={imageUrl} alt="Product" />
```

2. **Virtual scrolling for long lists**

```bash
npm install react-window
```

3. **Debounce search inputs**

```typescript
import { debounce } from "lodash";

const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);
```

---

## Next Steps

1. Test all mobile features on real devices
2. Optimize performance and bundle size
3. Implement Phase 3: Payment Integration
4. Add analytics tracking
5. Prepare for app store submission
