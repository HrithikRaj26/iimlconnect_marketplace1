import React from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  count?: number;
  dotColor?: string;
}

export function Checkbox({ checked, onChange, label, count, dotColor }: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5">
      <span className="flex items-center gap-2">
        <span
          className={[
            "flex h-4 w-4 items-center justify-center rounded border transition-colors",
            checked ? "border-brand bg-brand" : "border-gray-300 bg-white",
          ].join(" ")}
        >
          {checked && (
            <svg viewBox="0 0 20 20" fill="white" className="h-3 w-3">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        {dotColor && (
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: dotColor }}
            aria-hidden="true"
          />
        )}
        <span className="text-sm text-gray-700">{label}</span>
      </span>
      {typeof count === "number" && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </label>
  );
}
