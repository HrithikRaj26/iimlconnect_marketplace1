"use client";

import React, { useState } from "react";
import { CATEGORIES } from "@/types/lostFound";
import { TextInput } from "@/components/ui/TextInput";

/**
 * Pill selector over the known category list, plus a "+ Custom" option
 * that reveals a free-text field — the tier auto-suggestion
 * (suggestTierForCategory) already falls back to Tier 2 for any category
 * outside CATEGORY_TIER_MAP, so a custom value flows through unchanged.
 */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isKnownCategory = CATEGORIES.includes(value);
  const [customMode, setCustomMode] = useState(!isKnownCategory && value !== "");

  const selectCustom = () => {
    setCustomMode(true);
    onChange("");
  };

  const selectKnown = (c: string) => {
    setCustomMode(false);
    onChange(c);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => selectKnown(c)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              !customMode && value === c
                ? "border-brand bg-brand text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
            ].join(" ")}
          >
            {c}
          </button>
        ))}
        <button
          type="button"
          onClick={selectCustom}
          className={[
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            customMode
              ? "border-brand bg-brand text-white"
              : "border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-400",
          ].join(" ")}
        >
          + Custom
        </button>
      </div>
      {customMode && (
        <div className="mt-2">
          <TextInput
            autoFocus
            placeholder="Type your own category…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
