import { useState, useEffect } from 'react';

// ─── Toast Notification ───
export function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 
      bg-green-500/90 text-white px-5 py-2 rounded-full text-sm font-semibold
      animate-fade-in backdrop-blur-sm shadow-lg">
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
          className="transition-all duration-500 ease-out"
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
            onClick={() => onTap(filled ? count - 1 : i + 1)}
            className={`w-14 h-[4.5rem] rounded-xl border-none cursor-pointer
              flex flex-col items-center justify-center transition-all duration-200
              active:scale-95
              ${filled
                ? 'bg-gradient-to-br from-blue-500 to-blue-400 shadow-lg shadow-blue-500/30'
                : 'bg-white/[0.06]'
              }`}
          >
            <span className="text-2xl">{filled ? '💧' : '🫙'}</span>
            <span className={`text-[10px] mt-0.5 ${filled ? 'text-white' : 'text-white/30'}`}>
              32oz
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Card ───
export function Card({ children, className = '', highlight = false, ...props }) {
  return (
    <div
      className={`bg-white/[0.04] border rounded-[14px] px-4 py-4 mb-3
        ${highlight ? 'border-amber-500/60' : 'border-white/[0.08]'}
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
        ${className}`}
      {...props}
    />
  );
}

// ─── Button ───
export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
    warning: 'bg-amber-500 text-white hover:bg-amber-600',
    ghost: 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1]',
    danger: 'bg-red-500/15 text-red-400 hover:bg-red-500/25',
  };

  return (
    <button
      className={`rounded-[10px] px-4 py-2.5 text-sm font-semibold cursor-pointer
        transition-all duration-150 active:scale-95 border-none
        ${variants[variant] || variants.primary}
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Label ───
export function Label({ children }) {
  return (
    <label className="text-[11px] text-white/50 uppercase tracking-wider mb-1 block">
      {children}
    </label>
  );
}

// ─── Stat Box ───
export function StatBox({ value, label, color }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-white/50">{label}</div>
    </div>
  );
}
