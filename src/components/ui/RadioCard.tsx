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
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "w-full rounded-xl border p-4 text-left transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        selected ? "border-brand bg-brand-light" : "border-gray-200 bg-white hover:border-gray-300",
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
              selected ? "border-brand" : "border-gray-300",
            ].join(" ")}
          >
            {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
          </span>
        )}
        <div>
          <p className={["text-sm font-semibold", selected ? "text-brand-dark" : "text-gray-900"].join(" ")}>
            {label}
          </p>
          {helperText && <p className="mt-0.5 text-xs text-gray-500">{helperText}</p>}
        </div>
      </div>
    </button>
  );
}
