"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  variant?: "blue" | "gold" | "white";
  showText?: boolean;
}

export default function Logo({ 
  className = "", 
  size = 32, 
  variant = "blue",
  showText = false 
}: LogoProps) {
  // Color definitions based on user's logo attachment
  const colors = {
    blue: {
      primary: "#1c69d4",
      secondary: "#0d47a1",
      accent: "#3b82f6",
      shieldBg: "rgba(28, 105, 212, 0.08)"
    },
    gold: {
      primary: "#d4af37",
      secondary: "#b8860b",
      accent: "#f59e0b",
      shieldBg: "rgba(212, 175, 55, 0.1)"
    },
    white: {
      primary: "#ffffff",
      secondary: "#e2e8f0",
      accent: "#94a3b8",
      shieldBg: "rgba(255, 255, 255, 0.1)"
    }
  }[variant];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Precision Vector Shield + Checkmark + Ascending Arrow Emblem */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id={`shieldGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.accent} />
            <stop offset="50%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <filter id={`glow-${variant}`} x1="-20%" y1="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={colors.primary} floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Outer Shield Frame */}
        <path 
          d="M50 8 L82 22 C82 55 68 80 50 92 C32 80 18 55 18 22 Z" 
          stroke={`url(#shieldGrad-${variant})`} 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill={colors.shieldBg}
          filter={`url(#glow-${variant})`}
        />

        {/* Inner Curved Monogram / Loop */}
        <path 
          d="M38 48 C38 60 44 68 50 68 C56 68 62 60 62 48" 
          stroke={`url(#shieldGrad-${variant})`} 
          strokeWidth="6" 
          strokeLinecap="round"
        />

        {/* Bold Ascending Checkmark Arrow */}
        <path 
          d="M26 42 L42 62 L78 22" 
          stroke={`url(#shieldGrad-${variant})`} 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />

        {/* Arrowhead */}
        <path 
          d="M62 20 L80 20 L80 38" 
          stroke={`url(#shieldGrad-${variant})`} 
          strokeWidth="7" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-bold text-base tracking-tight text-[var(--ink)]">
              STUDENT PORTAL
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[var(--primary)] text-white tracking-widest uppercase">
              PRO
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-[2px] uppercase text-[var(--muted)] mt-0.5">
            ACADEMIC SUITE
          </span>
        </div>
      )}
    </div>
  );
}
