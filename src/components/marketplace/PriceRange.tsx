"use client";

import React from "react";
import { PRICE_CEILING, PRICE_FLOOR } from "@/constants/marketplace";

interface PriceRangeProps {
  minPrice: number;
  maxPrice: number;
  onChange: (min: number, max: number) => void;
}

export function PriceRange({ minPrice, maxPrice, onChange }: PriceRangeProps) {
  // Single range slider controls the max; the numeric fields allow precise entry
  // of both bounds. Kept intentionally simple and dependency-free.
  return (
    <div>
      <input
        type="range"
        min={PRICE_FLOOR}
        max={PRICE_CEILING}
        step={100}
        value={maxPrice}
        onChange={(e) => onChange(minPrice, Number(e.target.value))}
        aria-label="Maximum price"
        className="mb-3 w-full accent-brand"
      />
      <div className="flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">Minimum price</span>
          <div className="flex h-9 items-center rounded-lg border border-gray-300 px-2 text-sm">
            <span className="text-gray-400">Min: ₹</span>
            <input
              type="number"
              min={PRICE_FLOOR}
              max={maxPrice}
              value={minPrice}
              onChange={(e) => {
                const v = Math.min(Number(e.target.value) || 0, maxPrice);
                onChange(v, maxPrice);
              }}
              className="w-full bg-transparent px-1 text-gray-800 outline-none"
            />
          </div>
        </label>
        <span className="text-gray-400">to</span>
        <label className="flex-1">
          <span className="sr-only">Maximum price</span>
          <div className="flex h-9 items-center rounded-lg border border-gray-300 px-2 text-sm">
            <span className="text-gray-400">Max: ₹</span>
            <input
              type="number"
              min={minPrice}
              max={PRICE_CEILING}
              value={maxPrice}
              onChange={(e) => {
                const v = Math.max(Number(e.target.value) || 0, minPrice);
                onChange(minPrice, v);
              }}
              className="w-full bg-transparent px-1 text-gray-800 outline-none"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
