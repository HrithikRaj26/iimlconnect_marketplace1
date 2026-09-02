"use client";

import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "success" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-dark disabled:bg-brand/50 shadow-xs focus-visible:ring-brand",
  secondary:
    "bg-white dark:bg-gray-850 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-xs focus-visible:ring-gray-400",
  ghost:
    "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white focus-visible:ring-brand",
  success:
    "bg-success text-white hover:bg-emerald-700 disabled:bg-success/50 shadow-xs focus-visible:ring-success",
  danger:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 disabled:bg-red-600/50 shadow-xs focus-visible:ring-red-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {loading && (
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
