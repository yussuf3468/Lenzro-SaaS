/**
 * Enhanced SaleForm Component with Barcode Scanning
 * Mobile-optimized with offline support
 */

import { useState } from "react";
import { useCamera, useOffline } from "../hooks/useMobile";
import { Scan } from "lucide-react";
import BarcodeScanner from "./BarcodeScanner";

interface EnhancedSaleFormProps {
  onProductScanned?: (barcode: string) => void;
}

export default function EnhancedSaleForm({
  onProductScanned,
}: EnhancedSaleFormProps) {
  const [showScanner, setShowScanner] = useState(false);
  const { hasPermission, requestPermission } = useCamera();
  const { isOffline } = useOffline();

  const handleScanClick = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        alert("Camera permission is required for barcode scanning");
        return;
      }
    }
    setShowScanner(true);
  };

  const handleBarcodeScan = (barcode: string) => {
    console.log("Barcode scanned:", barcode);
    onProductScanned?.(barcode);
    setShowScanner(false);
  };

  return (
    <div className="space-y-4">
      {/* Offline warning */}
      {isOffline && (
        <div className="bg-orange-100 border border-orange-200 text-orange-800 p-3 rounded-lg flex items-center gap-2">
          <span className="text-sm font-medium">
            Working offline - changes will sync when connected
          </span>
        </div>
      )}

      {/* Barcode Scanner Button */}
      <button
        type="button"
        onClick={handleScanClick}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Scan className="w-5 h-5" />
        Scan Barcode
      </button>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Rest of your sale form... */}
    </div>
  );
}
