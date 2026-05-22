import { useState, useEffect, Component } from 'react';

// ─── Haptic feedback helper ───
export function haptic(pattern = 10) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ─── Error Boundary ───
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-white/50 mb-6">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold
              border-none cursor-pointer"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-white/40 bg-transparent border-none cursor-pointer"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Toast Notification ───
export function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50
      bg-green-500/90 text-white px-5 py-2 rounded-full text-sm font-semibold
      backdrop-blur-sm shadow-lg"
      style={{ animation: 'toastIn 0.2s ease-out' }}
    >
      {message}
    </div>
  );
}

// ─── Progress Ring ───
export function ProgressRing({ pct, size = 72, stroke = 7, color, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(Math.max(pct, 0), 1);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - p)}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ─── Water Bottles ───
export function WaterBottles({ count, total = 3, onTap }) {
  return (
    <div className="flex gap-2 justify-center mt-2 flex-wrap">
      {Array.from({ length: total }, (_, i) => {
        const filled = i < count;
        return (
          <button
            key={i}
            onClick={() => { haptic(15); onTap(filled ? count - 1 : i + 1); }}
            className={`w-14 h-[4.5rem] rounded-xl border-none cursor-pointer
              flex flex-col items-center justify-center transition-all duration-200
              active:scale-90
              ${filled
                ? 'bg-gradient-to-br from-blue-500 to-blue-400 shadow-lg shadow-blue-500/30'
                : 'bg-white/[0.06]'
              }`}
          >
            <span className="text-2xl">{filled ? '💧' : '🫙'}</span>
            <span className={`text-[12px] mt-0.5 ${filled ? 'text-white' : 'text-white/30'}`}>
              32oz
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Card ───
export function Card({ children, className = '', highlight = false, pressable = false, ...props }) {
  return (
    <div
      className={`bg-white/[0.04] border rounded-[14px] px-4 py-4 mb-3
        ${highlight ? 'border-amber-500/60' : 'border-white/[0.08]'}
        ${pressable ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Card Title ───
export function CardTitle({ children, right }) {
  return (
    <div className="flex justify-between items-center mb-2">
      <span className="text-[13px] font-semibold">{children}</span>
      {right && <span className="text-xs text-white/50">{right}</span>}
    </div>
  );
}

// ─── Input ───
export function Input({ className = '', ...props }) {
  return (
    <input
      className={`bg-white/[0.06] border border-white/[0.08] rounded-[10px]
        px-3.5 py-2.5 text-white/90 text-sm outline-none w-full
        placeholder:text-white/25 focus:border-blue-500/50 transition-colors
        min-h-[44px]
        ${className}`}
      {...props}
    />
  );
}

// ─── Button ───
export function Button({ children, variant = 'primary', className = '', onClick, ...props }) {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
    warning: 'bg-amber-500 text-white hover:bg-amber-600',
    ghost: 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1]',
    danger: 'bg-red-500/15 text-red-400 hover:bg-red-500/25',
  };

  const handleClick = (e) => {
    haptic(8);
    onClick?.(e);
  };

  return (
    <button
      className={`rounded-[10px] px-4 py-2.5 text-sm font-semibold cursor-pointer
        transition-all duration-150 active:scale-95 border-none min-h-[44px]
        ${variants[variant] || variants.primary}
        ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Label ───
export function Label({ children }) {
  return (
    <label className="text-[12px] text-white/50 uppercase tracking-wider mb-1 block">
      {children}
    </label>
  );
}

// ─── Toggle Switch ───
export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none min-h-[44px]">
      {label && <span className="text-sm text-white/80">{label}</span>}
      <div className="relative" onClick={onChange}>
        <div className={`w-12 h-6 rounded-full transition-colors duration-200
          ${checked ? 'bg-blue-500' : 'bg-white/[0.12]'}`} />
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md
          transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </label>
  );
}

// ─── Offline Indicator ───
export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] max-w-lg mx-auto
      bg-amber-500/95 text-white px-4 py-2 text-xs font-semibold text-center
      flex items-center justify-center gap-2">
      <span>📵</span> You're offline — data saves locally
    </div>
  );
}

// ─── Landscape hint ───
export function LandscapeHint() {
  return (
    <div className="landscape-hint hidden fixed inset-0 z-[9999] bg-[#0f1117]
      flex-col items-center justify-center">
      <div className="text-4xl mb-3">📱</div>
      <p className="text-sm text-white/60 text-center px-8">
        Rotate to portrait for the best experience
      </p>
    </div>
  );
}

// ─── Stat Box ───
export function StatBox({ value, label, color }) {
  return (
    <div className="text-center py-1">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-white/50">{label}</div>
    </div>
  );
}

// ─── Skeleton loader ───
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`bg-white/[0.06] rounded-lg animate-pulse ${className}`}
    />
  );
}

// ─── Pull to Refresh ───
export function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useState(0);
  const threshold = 60;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY[1](e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0) {
      const diff = e.touches[0].clientY - startY[0];
      if (diff > 0) {
        setPullY(Math.min(diff, threshold * 1.5));
        setPulling(diff > threshold);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pulling) {
      haptic(20);
      onRefresh?.();
    }
    setPullY(0);
    setPulling(false);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullY > 10 && (
        <div
          className="flex justify-center items-center text-sm text-white/40 overflow-hidden transition-all"
          style={{ height: pullY * 0.5 }}
        >
          {pulling ? '↑ Release to refresh' : '↓ Pull to refresh'}
        </div>
      )}
      {children}
    </div>
  );
}
