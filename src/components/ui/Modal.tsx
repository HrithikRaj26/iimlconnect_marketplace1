"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
  /** Side the panel slides in from. Defaults to "center" (scale-up) */
  variant?: "center" | "bottom" | "right";
}

const VARIANTS: Record<string, Variants> = {
  center: {
    hidden:  { opacity: 0, scale: 0.92, y: 12 },
    visible: { opacity: 1, scale: 1,    y: 0,
      transition: { type: "spring", stiffness: 380, damping: 30 } },
    exit:    { opacity: 0, scale: 0.94, y: 8,
      transition: { duration: 0.18, ease: "easeIn" } },
  },
  bottom: {
    hidden:  { opacity: 0, y: "100%" },
    visible: { opacity: 1, y: 0,
      transition: { type: "spring", stiffness: 320, damping: 32 } },
    exit:    { opacity: 0, y: "100%",
      transition: { duration: 0.2, ease: "easeIn" } },
  },
  right: {
    hidden:  { opacity: 0, x: "100%" },
    visible: { opacity: 1, x: 0,
      transition: { type: "spring", stiffness: 320, damping: 32 } },
    exit:    { opacity: 0, x: "100%",
      transition: { duration: 0.2, ease: "easeIn" } },
  },
};

/**
 * Portals to document.body rather than rendering in place. `position: fixed`
 * only escapes to the viewport if every ancestor is free of transform/
 * perspective/filter/will-change — a hover effect on a parent card (or
 * anything added later) can silently break that and trap the modal inside
 * the card's box. Portalling sidesteps the whole class of bug.
 */
export function Modal({ open, onClose, children, labelledBy, variant = "center" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (typeof window === "undefined") return null;

  const alignClass =
    variant === "bottom"
      ? "items-end justify-center"
      : variant === "right"
      ? "items-stretch justify-end"
      : "items-center justify-center";

  const cardClass =
    variant === "bottom"
      ? "relative z-10 w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
      : variant === "right"
      ? "relative z-10 h-full w-full max-w-md flex flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-2xl"
      : "relative z-10 w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={`fixed inset-0 z-50 flex ${alignClass} p-4`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className={cardClass}
            variants={VARIANTS[variant]}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
