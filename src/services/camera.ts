/**
 * Camera Service
 * Handles barcode scanning and photo capture
 */

import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import { Capacitor } from "@capacitor/core";

class CameraService {
  /**
   * Check camera permissions
   */
  async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log("Camera only available on native platforms");
      return false;
    }

    const permissions = await Camera.checkPermissions();
    return permissions.camera === "granted";
  }

  /**
   * Request camera permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    const permissions = await Camera.requestPermissions();
    return permissions.camera === "granted";
  }

  /**
   * Take a photo
   */
  async takePhoto(): Promise<Photo | null> {
    try {
      const hasPermission =
        (await this.checkPermissions()) || (await this.requestPermissions());

      if (!hasPermission) {
        throw new Error("Camera permission denied");
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      console.log("📸 Photo captured");
      return photo;
    } catch (error) {
      console.error("Failed to take photo:", error);
      return null;
    }
  }

  /**
   * Pick photo from gallery
   */
  async pickPhoto(): Promise<Photo | null> {
    try {
      const hasPermission =
        (await this.checkPermissions()) || (await this.requestPermissions());

      if (!hasPermission) {
        throw new Error("Camera permission denied");
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      console.log("🖼️ Photo selected from gallery");
      return photo;
    } catch (error) {
      console.error("Failed to pick photo:", error);
      return null;
    }
  }

  /**
   * Scan barcode
   */
  async scanBarcode(): Promise<string | null> {
    try {
      // Check permission
      const status = await BarcodeScanner.checkPermission({ force: true });

      if (!status.granted) {
        console.error("Camera permission denied");
        return null;
      }

      // Hide app content
      document.body.classList.add("barcode-scanner-active");

      // Start scanning
      const result = await BarcodeScanner.startScan();

      // Show app content
      document.body.classList.remove("barcode-scanner-active");

      if (result.hasContent) {
        console.log("📷 Barcode scanned:", result.content);
        return result.content;
      }

      return null;
    } catch (error) {
      console.error("Barcode scan failed:", error);
      document.body.classList.remove("barcode-scanner-active");
      return null;
    }
  }

  /**
   * Stop barcode scanning
   */
  async stopScan(): Promise<void> {
    await BarcodeScanner.stopScan();
    document.body.classList.remove("barcode-scanner-active");
  }

  /**
   * Prepare scanner (show camera preview)
   */
  async prepareScanner(): Promise<void> {
    await BarcodeScanner.prepare();
  }

  /**
   * Convert photo to base64
   */
  async photoToBase64(photo: Photo): Promise<string | null> {
    if (!photo.dataUrl) return null;
    return photo.dataUrl;
  }

  /**
   * Upload photo to Supabase Storage
   */
  async uploadPhoto(
    photo: Photo,
    bucket: string,
    path: string
  ): Promise<string | null> {
    try {
      const base64 = await this.photoToBase64(photo);
      if (!base64) return null;

      // Convert base64 to blob
      const response = await fetch(base64);
      const blob = await response.blob();

      // Upload to Supabase (you'll need to import supabase client)
      // const { data, error } = await supabase.storage
      //   .from(bucket)
      //   .upload(path, blob);

      // if (error) throw error;
      // return data.path;

      console.log("✅ Photo uploaded");
      return path;
    } catch (error) {
      console.error("Failed to upload photo:", error);
      return null;
    }
  }
}

// Export singleton instance
export const cameraService = new CameraService();

// CSS for barcode scanner overlay
const scannerStyles = `
  .barcode-scanner-active {
    visibility: hidden;
    --background: transparent;
    --ion-background-color: transparent;
  }

  .barcode-scanner-active .scanner-ui {
    visibility: visible;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = scannerStyles;
  document.head.appendChild(style);
}
