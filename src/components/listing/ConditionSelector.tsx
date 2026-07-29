import React from "react";
import { CONDITION_OPTIONS } from "@/constants/listing";
import { ItemCondition } from "@/types";

interface ConditionSelectorProps {
  value: ItemCondition | null;
  onChange: (value: ItemCondition) => void;
  error?: string;
}

export function ConditionSelector({ value, onChange, error }: ConditionSelectorProps) {
  return (
    <div className="w-full">
      <p className="mb-1.5 text-sm font-medium text-gray-800">
        Condition<span className="ml-0.5 text-red-500">*</span>
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CONDITION_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={[
                "rounded-lg border p-3 text-left transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                selected
                  ? "border-brand bg-brand-light"
                  : "border-gray-200 bg-white hover:border-gray-300",
              ].join(" ")}
            >
              <p className={["text-sm font-semibold", selected ? "text-brand-dark" : "text-gray-900"].join(" ")}>
                {opt.label}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{opt.helperText}</p>
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
