/**
 * Firebase Configuration Service
 * Initializes Firebase app for push notifications
 */

import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
} from "firebase/messaging";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// VAPID key for web push
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase
 */
export function initializeFirebase(): FirebaseApp | null {
  if (firebaseApp) return firebaseApp;

  try {
    // Check if all required config values are present
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn("⚠️ Firebase config missing. Push notifications disabled.");
      console.log(
        "Add Firebase config to .env file. See PHASE_2_SETUP_GUIDE.md"
      );
      return null;
    }

    firebaseApp = initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    return null;
  }
}

/**
 * Get Firebase Messaging instance
 */
export function getFirebaseMessaging(): Messaging | null {
  if (messaging) return messaging;

  try {
    const app = initializeFirebase();
    if (!app) return null;

    if (typeof window === "undefined") {
      console.log("Firebase Messaging only available in browser");
      return null;
    }

    messaging = getMessaging(app);
    console.log("✅ Firebase Messaging ready");
    return messaging;
  } catch (error) {
    console.error("❌ Failed to get Firebase Messaging:", error);
    return null;
  }
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const msg = getFirebaseMessaging();
    if (!msg) return null;

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Get FCM token
    if (!VAPID_KEY) {
      console.error("VAPID key not configured");
      return null;
    }

    const token = await getToken(msg, { vapidKey: VAPID_KEY });

    if (token) {
      console.log("✅ FCM Token received");
      return token;
    } else {
      console.log("No registration token available");
      return null;
    }
  } catch (error) {
    console.error("Failed to get FCM token:", error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(
  callback: (payload: any) => void
): (() => void) | null {
  try {
    const msg = getFirebaseMessaging();
    if (!msg) return null;

    const unsubscribe = onMessage(msg, (payload) => {
      console.log("📬 Foreground message received:", payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Failed to setup foreground message listener:", error);
    return null;
  }
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    VAPID_KEY
  );
}

/**
 * Get Firebase config status (for debugging)
 */
export function getFirebaseConfigStatus() {
  return {
    configured: isFirebaseConfigured(),
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    hasSenderId: !!firebaseConfig.messagingSenderId,
    hasVapidKey: !!VAPID_KEY,
    initialized: !!firebaseApp,
    messagingReady: !!messaging,
  };
}

// Auto-initialize on import (for web)
if (typeof window !== "undefined") {
  initializeFirebase();
}
