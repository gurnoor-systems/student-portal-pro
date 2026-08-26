"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, RotateCcw, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "info" | "error";
  title: string;
  description?: string;
  undoAction?: () => void;
  durationMs?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const duration = toast.durationMs || 5000;
    const newToast: ToastMessage = { ...toast, id, durationMs: duration };

    setToasts(prev => [...prev.slice(-3), newToast]); // Keep max 4 toasts

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const handleDismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Bottom Toast Container */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto w-full bg-[var(--surface-strong)]/95 backdrop-blur-md border border-[var(--hairline)] shadow-2xl p-3.5 rounded-2xl flex items-center justify-between gap-3 animate-slide-up text-[var(--ink)]"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {toast.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              {toast.type === "info" && (
                <Info className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
              )}

              <div className="truncate">
                <div className="text-xs font-bold text-[var(--ink)] truncate">{toast.title}</div>
                {toast.description && (
                  <div className="text-[11px] text-[var(--muted)] truncate">{toast.description}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {toast.undoAction && (
                <button
                  onClick={() => {
                    toast.undoAction?.();
                    handleDismiss(toast.id);
                  }}
                  className="px-2.5 py-1 bg-[var(--primary)]/15 hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white border border-[var(--primary)]/30 text-[11px] font-extrabold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo</span>
                </button>
              )}

              <button
                onClick={() => handleDismiss(toast.id)}
                className="p-1 text-[var(--muted)] hover:text-[var(--ink)] rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
