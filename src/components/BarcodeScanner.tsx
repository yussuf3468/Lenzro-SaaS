/**
 * Barcode Scanner Component
 * Full-screen barcode scanner UI
 */

import { useEffect } from "react";
import { useCamera } from "../hooks/useMobile";
import { X, Scan } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({
  onScan,
  onClose,
}: BarcodeScannerProps) {
  const { scanBarcode, stopScan } = useCamera();

  useEffect(() => {
    // Start scanning when component mounts
    startScan();

    // Stop scanning when component unmounts
    return () => {
      stopScan();
    };
  }, []);

  const startScan = async () => {
    const result = await scanBarcode();
    if (result) {
      onScan(result);
      onClose();
    }
  };

  const handleClose = async () => {
    await stopScan();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Scanner UI Overlay */}
      <div className="scanner-ui fixed inset-0 flex flex-col">
        {/* Header */}
        <div className="relative z-10 bg-black/50 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Scan Barcode</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm opacity-75 mt-1">
            Position barcode within the frame
          </p>
        </div>

        {/* Scanning Frame */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Corner indicators */}
          <div className="relative w-64 h-64">
            {/* Top-left corner */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl"></div>
            {/* Top-right corner */}
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl"></div>
            {/* Bottom-left corner */}
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl"></div>
            {/* Bottom-right corner */}
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-2xl"></div>

            {/* Scanning line animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan"></div>
            </div>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Scan className="w-16 h-16 text-white/50" />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="relative z-10 bg-black/50 text-white p-6 text-center">
          <div className="space-y-2">
            <p className="text-lg font-medium">Align barcode within frame</p>
            <p className="text-sm opacity-75">
              The scanner will automatically detect the barcode
            </p>
          </div>
        </div>
      </div>

      {/* Camera view is rendered by native plugin */}
    </div>
  );
}
