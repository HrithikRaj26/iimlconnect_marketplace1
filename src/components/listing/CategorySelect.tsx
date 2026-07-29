import React from "react";
import { CATEGORY_OPTIONS } from "@/constants/listing";
import { ItemCategory } from "@/types";

interface CategorySelectProps {
  value: ItemCategory | null;
  onChange: (value: ItemCategory) => void;
  error?: string;
}

export function CategorySelect({ value, onChange, error }: CategorySelectProps) {
  return (
    <div className="w-full">
      <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-gray-800">
        Category<span className="ml-0.5 text-red-500">*</span>
      </label>
      <select
        id="category"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value as ItemCategory)}
        aria-invalid={!!error}
        className={[
          "h-11 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition-colors",
          "focus:border-brand focus:ring-2 focus:ring-brand/20",
          error ? "border-red-400" : "border-gray-300",
        ].join(" ")}
      >
        <option value="" disabled>
          Select a category
        </option>
        {CATEGORY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
