import { useRef, useState, useEffect } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';

const ScannerComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    setScanner(codeReader);

    return () => {
      // Cleanup on unmount
      codeReader.reset();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const startScan = async () => {
    if (!scanner || !videoRef.current) return;
    setScanning(true);
    setBarcodeResult(null);

    try {
      const result = await scanner.decodeOnceFromVideoDevice(undefined, videoRef.current.id);
      setBarcodeResult(result.getText());
      console.log('Barcode result:', result.getText());
      setScanning(false);
      scanner.reset();
    } catch (err) {
      if (err instanceof NotFoundException) {
        console.warn('No barcode found');
        setBarcodeResult('No barcode found');
      } else {
        console.error('Scanner error:', err);
        setBarcodeResult('Scanner error');
      }
      setScanning(false);
      scanner.reset();
    }
  };

  const stopScan = () => {
    if (!scanner) return;
    scanner.reset();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    setBarcodeResult(null);
  };

  return (
    <div className="scanner-container">
      <h2>Barcode Scanner</h2>
      <video
        id="scannerVideo"
        ref={videoRef}
        width={320}
        height={240}
        style={{ border: '1px solid #ccc', marginBottom: '10px' }}
      />
      <div>
        <button onClick={startScan} disabled={scanning} style={{ marginRight: '10px' }}>
          {scanning ? 'Scanning...' : 'Start Scan'}
        </button>
        <button onClick={stopScan} disabled={!scanning}>
          Stop Scan
        </button>
      </div>
      {barcodeResult && <p>Result: {barcodeResult}</p>}
    </div>
  );
};

export default ScannerComponent;
