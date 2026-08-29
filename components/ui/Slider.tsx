"use client";

import React from "react";

interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  badgeSuffix?: string;
  badgePrefix?: string;
  showValueBadge?: boolean;
  className?: string;
}

export default function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  badgeSuffix = "%",
  badgePrefix = "",
  showValueBadge = true,
  className = ""
}: SliderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {(label || showValueBadge) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-bold text-[var(--ink)]">{label}</span>}
          {showValueBadge && (
            <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
              {badgePrefix}{value}{badgeSuffix}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-300 dark:bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
        />
      </div>
    </div>
  );
}
