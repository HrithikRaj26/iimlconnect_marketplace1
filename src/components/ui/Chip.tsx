import React from "react";

interface ChipProps {
  label: string;
  onRemove?: () => void;
  tone?: "neutral" | "brand" | "success";
}

const toneClasses: Record<NonNullable<ChipProps["tone"]>, string> = {
  neutral: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50",
  brand: "bg-brand-light/35 dark:bg-brand/10 text-brand-dark dark:text-brand-light border border-brand/10 dark:border-brand-light/10",
  success: "bg-success-light/35 dark:bg-success/10 text-success dark:text-success border border-success/10 dark:border-success-light/10",
};

export function Chip({ label, onRemove, tone = "neutral" }: ChipProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold select-none",
        toneClasses[tone],
      ].join(" ")}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="ml-0.5 rounded-full hover:opacity-70"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </span>
  );
}
