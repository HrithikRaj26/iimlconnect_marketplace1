import React from "react";

interface ChipProps {
  label: string;
  onRemove?: () => void;
  tone?: "neutral" | "brand" | "success";
}

const toneClasses: Record<NonNullable<ChipProps["tone"]>, string> = {
  neutral: "bg-gray-100 text-gray-700",
  brand: "bg-brand-light text-brand-dark",
  success: "bg-success-light text-success",
};

export function Chip({ label, onRemove, tone = "neutral" }: ChipProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
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
