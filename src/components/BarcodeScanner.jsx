import { useEffect, useRef, useState } from 'react';

export function BarcodeScanner({ onScan, onClose }) {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let html5QrCode = null;
    let stopped = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (stopped || !containerRef.current) return;

        html5QrCode = new Html5Qrcode('barcode-scanner-container');
        scannerRef.current = html5QrCode;

        setLoading(false);

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (navigator.vibrate) navigator.vibrate(100);
            html5QrCode.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {} // scan failure - ignore
        );
      } catch (err) {
        if (!stopped) {
          setLoading(false);
          setError(err?.message || 'Camera unavailable. Try searching by name instead.');
        }
      }
    }

    startScanner();

    return () => {
      stopped = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <div className="text-white font-bold text-lg">Scan Barcode</div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 text-white border-none cursor-pointer
            text-lg flex items-center justify-center active:opacity-70"
        >
          ✕
        </button>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {loading && !error && (
          <div className="text-white/60 text-center mb-4">
            <div className="text-4xl mb-3">📸</div>
            <p>Starting camera...</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <div className="text-4xl mb-4">📷</div>
            <p className="text-white/70 text-base mb-2">Camera unavailable</p>
            <p className="text-white/40 text-sm mb-6">{error}</p>
            <button
              onClick={onClose}
              className="bg-blue-500 text-white rounded-2xl px-6 py-3 font-semibold
                border-none cursor-pointer"
            >
              Search by name instead
            </button>
          </div>
        )}

        {/* Camera viewfinder */}
        <div
          id="barcode-scanner-container"
          ref={containerRef}
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ display: error ? 'none' : 'block' }}
        />

        {!error && !loading && (
          <div className="mt-4 text-center">
            <p className="text-white/50 text-sm">Point camera at a barcode</p>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {!error && (
        <div className="px-6 py-5" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}>
          <button
            onClick={onClose}
            className="w-full bg-white/10 text-white/70 rounded-2xl py-4 text-base font-semibold
              border-none cursor-pointer active:bg-white/20"
          >
            Cancel — search by name
          </button>
        </div>
      )}
    </div>
  );
}
