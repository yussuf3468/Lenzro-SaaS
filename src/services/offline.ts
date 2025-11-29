/**
 * Offline Storage Service
 * Handles offline data persistence and synchronization
 */

import { Preferences } from "@capacitor/preferences";
import { Network } from "@capacitor/network";
import { supabase } from "../lib/supabase";

export interface OfflineTransaction {
  id: string;
  type: "sale" | "order" | "product" | "expense";
  action: "create" | "update" | "delete";
  data: any;
  timestamp: string;
  synced: boolean;
  attempts: number;
}

class OfflineService {
  private syncQueue: OfflineTransaction[] = [];
  private isOnline = true;
  private syncInProgress = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize offline service
   */
  private async initialize(): Promise<void> {
    // Check initial network status
    const status = await Network.getStatus();
    this.isOnline = status.connected;

    // Listen for network changes
    Network.addListener("networkStatusChange", (status) => {
      const wasOffline = !this.isOnline;
      this.isOnline = status.connected;

      console.log("Network status:", status.connected ? "Online" : "Offline");

      // Auto-sync when coming back online
      if (wasOffline && this.isOnline) {
        console.log("📶 Back online, syncing...");
        this.syncAll();
      }
    });

    // Load existing queue
    await this.loadQueue();

    console.log("✅ Offline service initialized");
  }

  /**
   * Check if device is online
   */
  async isDeviceOnline(): Promise<boolean> {
    const status = await Network.getStatus();
    return status.connected;
  }

  /**
   * Save data locally (for offline access)
   */
  async saveLocal(key: string, data: any): Promise<void> {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(data),
      });
      console.log(`💾 Saved locally: ${key}`);
    } catch (error) {
      console.error("Failed to save local data:", error);
    }
  }

  /**
   * Get data from local storage
   */
  async getLocal<T>(key: string): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Failed to get local data:", error);
      return null;
    }
  }

  /**
   * Remove data from local storage
   */
  async removeLocal(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
      console.log(`🗑️ Removed local: ${key}`);
    } catch (error) {
      console.error("Failed to remove local data:", error);
    }
  }

  /**
   * Add transaction to sync queue
   */
  async queueTransaction(
    transaction: Omit<
      OfflineTransaction,
      "id" | "timestamp" | "synced" | "attempts"
    >
  ): Promise<void> {
    const queueItem: OfflineTransaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      synced: false,
      attempts: 0,
    };

    this.syncQueue.push(queueItem);
    await this.saveQueue();

    console.log("📋 Transaction queued:", queueItem.type, queueItem.action);

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.syncAll();
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveQueue(): Promise<void> {
    await this.saveLocal("sync_queue", this.syncQueue);
  }

  /**
   * Load sync queue from storage
   */
  private async loadQueue(): Promise<void> {
    const queue = await this.getLocal<OfflineTransaction[]>("sync_queue");
    this.syncQueue = queue || [];
    console.log(`📋 Loaded ${this.syncQueue.length} queued transactions`);
  }

  /**
   * Sync all pending transactions
   */
  async syncAll(): Promise<void> {
    if (this.syncInProgress) {
      console.log("⏳ Sync already in progress");
      return;
    }

    if (!this.isOnline) {
      console.log("📵 Device is offline, skipping sync");
      return;
    }

    if (this.syncQueue.length === 0) {
      console.log("✅ No transactions to sync");
      return;
    }

    this.syncInProgress = true;
    console.log(`🔄 Syncing ${this.syncQueue.length} transactions...`);

    const pending = this.syncQueue.filter((t) => !t.synced);
    let successCount = 0;
    let failCount = 0;

    for (const transaction of pending) {
      try {
        await this.syncTransaction(transaction);
        transaction.synced = true;
        successCount++;
      } catch (error) {
        transaction.attempts++;
        failCount++;
        console.error(`Failed to sync transaction ${transaction.id}:`, error);

        // Remove from queue if too many attempts
        if (transaction.attempts >= 3) {
          console.error(
            `❌ Giving up on transaction ${transaction.id} after 3 attempts`
          );
          transaction.synced = true; // Mark as synced to remove it
        }
      }
    }

    // Remove synced transactions
    this.syncQueue = this.syncQueue.filter((t) => !t.synced);
    await this.saveQueue();

    this.syncInProgress = false;
    console.log(
      `✅ Sync complete: ${successCount} success, ${failCount} failed`
    );
  }

  /**
   * Sync individual transaction
   */
  private async syncTransaction(
    transaction: OfflineTransaction
  ): Promise<void> {
    const { type, action, data } = transaction;

    switch (type) {
      case "sale":
        await this.syncSale(action, data);
        break;
      case "order":
        await this.syncOrder(action, data);
        break;
      case "product":
        await this.syncProduct(action, data);
        break;
      case "expense":
        await this.syncExpense(action, data);
        break;
      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }
  }

  /**
   * Sync sale transaction
   */
  private async syncSale(action: string, data: any): Promise<void> {
    if (action === "create") {
      const { error } = await supabase.from("sales").insert(data);
      if (error) throw error;
    } else if (action === "update") {
      const { error } = await supabase
        .from("sales")
        .update(data)
        .eq("id", data.id);
      if (error) throw error;
    }
  }

  /**
   * Sync order transaction
   */
  private async syncOrder(action: string, data: any): Promise<void> {
    if (action === "create") {
      const { error } = await supabase.from("orders").insert(data);
      if (error) throw error;
    } else if (action === "update") {
      const { error } = await supabase
        .from("orders")
        .update(data)
        .eq("id", data.id);
      if (error) throw error;
    }
  }

  /**
   * Sync product transaction
   */
  private async syncProduct(action: string, data: any): Promise<void> {
    if (action === "create") {
      const { error } = await supabase.from("products").insert(data);
      if (error) throw error;
    } else if (action === "update") {
      const { error } = await supabase
        .from("products")
        .update(data)
        .eq("id", data.id);
      if (error) throw error;
    }
  }

  /**
   * Sync expense transaction
   */
  private async syncExpense(action: string, data: any): Promise<void> {
    if (action === "create") {
      const { error } = await supabase.from("expenses").insert(data);
      if (error) throw error;
    }
  }

  /**
   * Get pending sync count
   */
  getPendingCount(): number {
    return this.syncQueue.filter((t) => !t.synced).length;
  }

  /**
   * Clear all local data (use with caution!)
   */
  async clearAll(): Promise<void> {
    await Preferences.clear();
    this.syncQueue = [];
    console.log("🗑️ All local data cleared");
  }
}

// Export singleton instance
export const offlineService = new OfflineService();

// Helper function to cache frequently accessed data
export async function cacheData(
  key: string,
  fetchFn: () => Promise<any>,
  ttl = 3600000
): Promise<any> {
  const cacheKey = `cache_${key}`;
  const timestampKey = `cache_${key}_timestamp`;

  // Check if cache exists and is still valid
  const cached = await offlineService.getLocal(cacheKey);
  const timestamp = await offlineService.getLocal<number>(timestampKey);

  if (cached && timestamp && Date.now() - timestamp < ttl) {
    console.log(`📦 Using cached data for: ${key}`);
    return cached;
  }

  // Fetch fresh data
  try {
    const data = await fetchFn();
    await offlineService.saveLocal(cacheKey, data);
    await offlineService.saveLocal(timestampKey, Date.now());
    console.log(`✅ Cached fresh data for: ${key}`);
    return data;
  } catch (error) {
    // Return cached data if fetch fails and cache exists
    if (cached) {
      console.warn(`⚠️ Using stale cache for: ${key}`);
      return cached;
    }
    throw error;
  }
}
