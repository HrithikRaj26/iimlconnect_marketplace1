import React from "react";

interface RadioCardProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  helperText?: string;
  layout?: "vertical" | "horizontal";
}

export function RadioCard({
  selected,
  onSelect,
  label,
  helperText,
  layout = "horizontal",
}: RadioCardProps) {
  return (
    <button
      type="button"
      role="radio"
      onClick={onSelect}
      aria-checked={selected}
      className={[
        "w-full rounded-xl border p-4 text-left transition-colors duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950",
        selected
          ? "border-brand bg-brand-light/70 dark:bg-brand/15 text-gray-900 dark:text-gray-100"
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700",
      ].join(" ")}
    >
      <div
        className={
          layout === "horizontal" ? "flex items-start gap-3" : "flex flex-col gap-1"
        }
      >
        {layout === "horizontal" && (
          <span
            className={[
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
              selected ? "border-brand" : "border-gray-300 dark:border-gray-700",
            ].join(" ")}
          >
            {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
          </span>
        )}
        <div>
          <p className={["text-sm font-semibold", selected ? "text-brand-dark dark:text-brand-light" : "text-gray-900 dark:text-gray-100"].join(" ")}>
            {label}
          </p>
          {helperText && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
        </div>
      </div>
    </button>
  );
}
