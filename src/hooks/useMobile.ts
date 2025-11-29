/**
 * React Hook for Offline Support
 */

import { useState, useEffect } from "react";
import { offlineService } from "../services/offline";
import { Network } from "@capacitor/network";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    // Check initial status
    checkStatus();

    // Listen for network changes
    const listener = Network.addListener("networkStatusChange", (status) => {
      setIsOnline(status.connected);
      updatePendingCount();
    });

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      listener.remove();
      clearInterval(interval);
    };
  }, []);

  const checkStatus = async () => {
    const online = await offlineService.isDeviceOnline();
    setIsOnline(online);
    updatePendingCount();
  };

  const updatePendingCount = () => {
    setPendingSync(offlineService.getPendingCount());
  };

  const sync = async () => {
    await offlineService.syncAll();
    updatePendingCount();
  };

  const saveLocal = async (key: string, data: any) => {
    await offlineService.saveLocal(key, data);
  };

  const getLocal = async <T>(key: string): Promise<T | null> => {
    return await offlineService.getLocal<T>(key);
  };

  return {
    isOnline,
    isOffline: !isOnline,
    pendingSync,
    sync,
    saveLocal,
    getLocal,
  };
}

/**
 * React Hook for Push Notifications
 */

import { useEffect as useEffectNotif } from "react";
import { notificationService } from "../services/notifications";

export function useNotifications() {
  useEffectNotif(() => {
    // Initialize notifications on mount
    notificationService.initialize();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  const sendNotification = async (
    userId: string,
    title: string,
    body: string,
    data?: any
  ) => {
    return await notificationService.constructor.sendToUser(userId, {
      title,
      body,
      data,
    });
  };

  return {
    sendNotification,
    getToken: () => notificationService.getToken(),
  };
}

/**
 * React Hook for Camera/Barcode Scanning
 */

import { useState as useCameraState } from "react";
import { cameraService } from "../services/camera";

export function useCamera() {
  const [scanning, setScanning] = useCameraState(false);
  const [hasPermission, setHasPermission] = useCameraState<boolean | null>(
    null
  );

  useEffectNotif(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await cameraService.checkPermissions();
    setHasPermission(granted);
  };

  const requestPermission = async () => {
    const granted = await cameraService.requestPermissions();
    setHasPermission(granted);
    return granted;
  };

  const takePhoto = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }
    return await cameraService.takePhoto();
  };

  const pickPhoto = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }
    return await cameraService.pickPhoto();
  };

  const scanBarcode = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    setScanning(true);
    const result = await cameraService.scanBarcode();
    setScanning(false);
    return result;
  };

  const stopScan = async () => {
    await cameraService.stopScan();
    setScanning(false);
  };

  return {
    hasPermission,
    scanning,
    requestPermission,
    takePhoto,
    pickPhoto,
    scanBarcode,
    stopScan,
  };
}
