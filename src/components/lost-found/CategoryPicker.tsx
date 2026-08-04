"use client";

import React from "react";
import { CATEGORIES } from "@/types/lostFound";

export function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={[
            "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
            value === c ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
          ].join(" ")}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
