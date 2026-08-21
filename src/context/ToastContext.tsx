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
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
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
    <ToastContext.Provider value={{ showToast }}>
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
