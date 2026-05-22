import { useEffect, useRef, useState, useCallback } from 'react';

export function BarcodeScanner({ onScan, onClose }) {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const timeoutRef = useRef(null);
  const stoppedRef = useRef(false);
  const [status, setStatus] = useState('starting'); // starting | scanning | error | timeout
  const [errorMsg, setErrorMsg] = useState('');

  // Stable callback ref so scanner doesn't re-init on re-renders
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  useEffect(() => {
    stoppedRef.current = false;

    async function startScanner() {
      try {
        // First request camera permission explicitly so the browser prompt fires
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

        if (stoppedRef.current) return;

        const { Html5Qrcode } = await import('html5-qrcode');

        if (stoppedRef.current || !containerRef.current) return;

        const html5QrCode = new Html5Qrcode('barcode-scanner-container');
        scannerRef.current = html5QrCode;

        setStatus('scanning');

        // 30-second timeout
        timeoutRef.current = setTimeout(() => {
          if (!stoppedRef.current) {
            setStatus('timeout');
            html5QrCode.stop().catch(() => {});
          }
        }, 30000);

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (stoppedRef.current) return;
            clearTimeout(timeoutRef.current);
            if (navigator.vibrate) navigator.vibrate(100);
            html5QrCode.stop().catch(() => {});
            stoppedRef.current = true;
            onScanRef.current(decodedText);
          },
          () => {} // scan failure - ignore per-frame errors
        );
      } catch (err) {
        if (stoppedRef.current) return;
        clearTimeout(timeoutRef.current);
        const msg = err?.message || String(err);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('notallowed')) {
          setErrorMsg('Camera permission denied. Enable camera access in your browser settings, then reload.');
        } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('no camera')) {
          setErrorMsg('No camera found on this device.');
        } else if (!window.isSecureContext) {
          setErrorMsg('Camera requires HTTPS. This works on the live app at your Vercel URL.');
        } else {
          setErrorMsg(msg || 'Camera unavailable. Try searching by food name instead.');
        }
        setStatus('error');
      }
    }

    startScanner();

    return () => {
      stoppedRef.current = true;
      clearTimeout(timeoutRef.current);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []); // run once on mount

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
        {status === 'starting' && (
          <div className="text-white/60 text-center mb-4">
            <div className="text-4xl mb-3 animate-pulse">📸</div>
            <p className="text-base">Starting camera...</p>
            <p className="text-sm text-white/30 mt-2">Allow camera access if prompted</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-5xl mb-4">📷</div>
            <p className="text-white/70 text-base mb-2 font-semibold">Camera unavailable</p>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">{errorMsg}</p>
            <button
              onClick={onClose}
              className="bg-blue-500 text-white rounded-2xl px-6 py-3 font-semibold
                border-none cursor-pointer text-base"
            >
              Search by name instead
            </button>
          </div>
        )}

        {status === 'timeout' && (
          <div className="text-center">
            <div className="text-5xl mb-4">⏱️</div>
            <p className="text-white/70 text-base mb-2 font-semibold">No barcode found</p>
            <p className="text-white/40 text-sm mb-6">Try holding your phone closer, or enter the food name manually.</p>
            <button
              onClick={onClose}
              className="bg-blue-500 text-white rounded-2xl px-6 py-3 font-semibold
                border-none cursor-pointer text-base"
            >
              Search by name instead
            </button>
          </div>
        )}

        {/* Camera viewfinder — always in DOM so scanner can mount to it */}
        <div
          id="barcode-scanner-container"
          ref={containerRef}
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ display: status === 'scanning' ? 'block' : 'none' }}
        />

        {status === 'scanning' && (
          <div className="mt-4 text-center">
            <p className="text-white/50 text-sm">Point camera at barcode</p>
            <p className="text-white/25 text-xs mt-1">Times out in 30 seconds</p>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {(status === 'scanning' || status === 'starting') && (
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
