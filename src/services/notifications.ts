/**
 * Push Notifications Service
 * Handles Firebase Cloud Messaging for web and mobile
 */

import {
  PushNotifications,
  Token,
  ActionPerformed,
} from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../lib/supabase";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: number;
}

class NotificationService {
  private initialized = false;
  private fcmToken: string | null = null;

  /**
   * Initialize push notifications
   * Call this once when app starts
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log("Push notifications only available on native platforms");
      return;
    }

    try {
      // Request permission
      const permissionStatus = await PushNotifications.requestPermissions();

      if (permissionStatus.receive === "granted") {
        // Register with FCM
        await PushNotifications.register();

        // Listen for registration
        await PushNotifications.addListener(
          "registration",
          this.handleRegistration.bind(this)
        );

        // Listen for registration errors
        await PushNotifications.addListener(
          "registrationError",
          this.handleRegistrationError.bind(this)
        );

        // Listen for incoming notifications
        await PushNotifications.addListener(
          "pushNotificationReceived",
          this.handleNotificationReceived.bind(this)
        );

        // Listen for notification actions
        await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          this.handleNotificationAction.bind(this)
        );

        this.initialized = true;
        console.log("✅ Push notifications initialized");
      } else {
        console.warn("Push notification permission denied");
      }
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
    }
  }

  /**
   * Handle successful registration
   */
  private async handleRegistration(token: Token): Promise<void> {
    console.log("Push registration success, token:", token.value);
    this.fcmToken = token.value;

    // Save token to database
    await this.saveTokenToDatabase(token.value);
  }

  /**
   * Handle registration error
   */
  private handleRegistrationError(error: any): void {
    console.error("Push registration error:", error);
  }

  /**
   * Handle notification received while app is open
   */
  private handleNotificationReceived(notification: any): void {
    console.log("Notification received:", notification);

    // Show in-app notification or update UI
    this.showInAppNotification(notification);
  }

  /**
   * Handle notification tap/action
   */
  private handleNotificationAction(action: ActionPerformed): void {
    console.log("Notification action:", action);

    // Navigate based on notification data
    const data = action.notification.data;
    this.handleNotificationNavigation(data);
  }

  /**
   * Save FCM token to database
   */
  private async saveTokenToDatabase(token: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Save to user_profiles or separate device_tokens table
      const { error } = await supabase
        .from("user_profiles")
        .update({
          metadata: { fcm_token: token },
        })
        .eq("id", user.id);

      if (error) {
        console.error("Failed to save FCM token:", error);
      } else {
        console.log("✅ FCM token saved to database");
      }
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }

  /**
   * Show in-app notification
   */
  private showInAppNotification(notification: any): void {
    // You can integrate with your toast/notification UI here
    console.log("📱 New notification:", notification.title);

    // Example: Show browser notification on web
    if (!Capacitor.isNativePlatform() && "Notification" in window) {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.data?.icon || "/lenzro-icon-192.png",
      });
    }
  }

  /**
   * Handle navigation from notification
   */
  private handleNotificationNavigation(data: any): void {
    if (!data) return;

    // Navigate based on notification type
    switch (data.type) {
      case "low_stock":
        window.location.href = "/inventory";
        break;
      case "new_order":
        window.location.href = "/orders";
        break;
      case "payment_received":
        window.location.href = "/sales";
        break;
      case "team_invite":
        window.location.href = "/settings/organization";
        break;
      default:
        console.log("Unknown notification type:", data.type);
    }
  }

  /**
   * Send notification to specific user (backend function)
   * This should be called from a Supabase Edge Function
   */
  static async sendToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Call Supabase Edge Function to send notification
      const { data, error } = await supabase.functions.invoke(
        "send-notification",
        {
          body: {
            userId,
            notification: payload,
          },
        }
      );

      if (error) throw error;

      console.log("✅ Notification sent:", data);
      return true;
    } catch (error) {
      console.error("Failed to send notification:", error);
      return false;
    }
  }

  /**
   * Send notification to organization members
   */
  static async sendToOrganization(
    organizationId: string,
    payload: NotificationPayload,
    excludeUserId?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-notification",
        {
          body: {
            organizationId,
            excludeUserId,
            notification: payload,
          },
        }
      );

      if (error) throw error;

      console.log("✅ Organization notification sent:", data);
      return true;
    } catch (error) {
      console.error("Failed to send organization notification:", error);
      return false;
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Remove all listeners (call on app unmount)
   */
  async cleanup(): Promise<void> {
    await PushNotifications.removeAllListeners();
    this.initialized = false;
    console.log("Push notifications cleanup complete");
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Notification templates for common scenarios
export const NotificationTemplates = {
  lowStock: (productName: string, quantity: number): NotificationPayload => ({
    title: "⚠️ Low Stock Alert",
    body: `${productName} is running low (${quantity} remaining)`,
    data: { type: "low_stock", productName, quantity },
  }),

  newOrder: (
    orderNumber: string,
    customerName: string
  ): NotificationPayload => ({
    title: "🛍️ New Order",
    body: `New order #${orderNumber} from ${customerName}`,
    data: { type: "new_order", orderNumber, customerName },
  }),

  paymentReceived: (amount: number, currency: string): NotificationPayload => ({
    title: "💰 Payment Received",
    body: `You received ${currency} ${amount.toFixed(2)}`,
    data: { type: "payment_received", amount, currency },
  }),

  teamInvite: (
    organizationName: string,
    inviterName: string
  ): NotificationPayload => ({
    title: "👥 Team Invitation",
    body: `${inviterName} invited you to join ${organizationName}`,
    data: { type: "team_invite", organizationName, inviterName },
  }),

  subscriptionExpiring: (daysLeft: number): NotificationPayload => ({
    title: "⏰ Subscription Expiring",
    body: `Your subscription expires in ${daysLeft} days`,
    data: { type: "subscription_expiring", daysLeft },
  }),

  orderStatusUpdate: (
    orderNumber: string,
    status: string
  ): NotificationPayload => ({
    title: "📦 Order Update",
    body: `Order #${orderNumber} is now ${status}`,
    data: { type: "order_status", orderNumber, status },
  }),
};
