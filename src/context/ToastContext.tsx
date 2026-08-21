"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  confirmAction: (
    message: string,
    onConfirm: () => void,
    title?: string,
    variant?: "danger" | "primary" | "warning"
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    message: string;
    title: string;
    variant: "danger" | "primary" | "warning";
    onConfirm: () => void;
  } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const confirmAction = useCallback((
    message: string,
    onConfirm: () => void,
    title: string = "Confirm Action",
    variant: "danger" | "primary" | "warning" = "danger"
  ) => {
    setConfirmState({ message, onConfirm, title, variant });
  }, []);

  // Intercept native browser alert popups globally!
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalAlert = window.alert;

    window.alert = (message: string) => {
      const lower = String(message).toLowerCase();
      let type: ToastType = "info";
      
      if (lower.includes("success") || lower.includes("copied") || lower.includes("saved") || lower.includes("agreed") || lower.includes("accepted")) {
        type = "success";
      } else if (lower.includes("fail") || lower.includes("error") || lower.includes("invalid") || lower.includes("cannot") || lower.includes("unsupported")) {
        type = "error";
      } else if (lower.includes("warning") || lower.includes("verify") || lower.includes("attention")) {
        type = "warning";
      }
      
      showToast(message, type);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, confirmAction }}>
      {children}
      
      {/* Toast floating overlay container */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              "pointer-events-auto flex items-start justify-between gap-3.5 px-4 py-3.5 rounded-2xl border shadow-xl text-xs font-bold transition-all duration-300 transform translate-y-0 scale-100 ease-out select-none bg-white/95 dark:bg-gray-900/95 backdrop-blur-md",
              toast.type === "success" ? "border-green-200 text-green-700 bg-green-50/95 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30 shadow-green-500/5" :
              toast.type === "error" ? "border-red-200 text-red-700 bg-red-50/95 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 shadow-red-500/5" :
              toast.type === "warning" ? "border-amber-200 text-amber-700 bg-amber-50/95 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 shadow-amber-500/5" :
              "border-blue-200 text-blue-700 bg-blue-50/95 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 shadow-blue-500/5"
            ].join(" ")}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="text-sm shrink-0">
                {toast.type === "success" ? "✓" :
                 toast.type === "error" ? "⚠️" :
                 toast.type === "warning" ? "⚡" : "ℹ️"}
              </span>
              <span className="leading-relaxed break-words">{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-black text-sm shrink-0 cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Styled Confirmation Modal Overlay */}
      {confirmState && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-wider mb-2">
              {confirmState.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed mb-6">
              {confirmState.message}
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(null);
                }}
                className={[
                  "px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors shadow-sm",
                  confirmState.variant === "danger" ? "bg-red-600 hover:bg-red-700 shadow-red-500/10" :
                  confirmState.variant === "warning" ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/10" :
                  "bg-brand hover:bg-brand-dark shadow-blue-500/10"
                ].join(" ")}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
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
