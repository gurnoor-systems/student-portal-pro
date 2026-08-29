"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "md",
  showCloseButton = true
}: ModalProps) {
  // Physical Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl"
  }[maxWidth];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClasses} bg-[var(--surface)] border border-[var(--hairline)] rounded-2xl shadow-2xl overflow-hidden animate-scale-up text-[var(--ink)]`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-5 border-b border-[var(--hairline)] bg-[var(--surface-soft)]">
            <div>
              {typeof title === "string" ? (
                <h3 className="text-base sm:text-lg font-bold text-[var(--ink)]">{title}</h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-strong)] rounded-lg transition-colors cursor-pointer"
                title="Close (Escape)"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
