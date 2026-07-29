"use client";

import React from "react";
import { FilterSection } from "@/components/marketplace/FilterSection";
import { Checkbox } from "@/components/ui/Checkbox";
import { PriceRange } from "@/components/marketplace/PriceRange";
import { Button } from "@/components/ui/Button";
import {
  FILTER_CATEGORY_OPTIONS,
  FILTER_CONDITION_OPTIONS,
  FILTER_PICKUP_OPTIONS,
} from "@/constants/marketplace";
import { MOCK_LISTINGS } from "@/constants/mockListings";
import { ItemCategory, ItemCondition, MarketplaceFilters, PickupFilter } from "@/types";

interface FilterSidebarProps {
  filters: MarketplaceFilters;
  onChange: (updater: Partial<MarketplaceFilters>) => void;
  onApply: () => void;
  onReset: () => void;
}

// Precompute counts per facet from the seed data so the sidebar mirrors the design.
function countBy<T extends string>(key: (l: (typeof MOCK_LISTINGS)[number]) => T) {
  return MOCK_LISTINGS.reduce<Record<string, number>>((acc, l) => {
    const k = key(l);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

const categoryCounts = countBy((l) => l.category);
const conditionCounts = countBy((l) => l.condition);
const pickupCounts = countBy((l) => l.pickup);

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterSidebar({ filters, onChange, onApply, onReset }: FilterSidebarProps) {
  return (
    <aside className="w-full rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Filters</h2>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400">
          <path d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 20.25v-6.037a2.25 2.25 0 00-.659-1.591L2.659 7.939A2.25 2.25 0 012 6.35V4.34a.75.75 0 01.628-.74z" />
        </svg>
      </div>

      <FilterSection title="Category">
        <div>
          {FILTER_CATEGORY_OPTIONS.map((opt) => (
            <Checkbox
              key={opt.value}
              label={opt.label}
              count={categoryCounts[opt.value] ?? 0}
              checked={filters.categories.includes(opt.value)}
              onChange={() =>
                onChange({ categories: toggle<ItemCategory>(filters.categories, opt.value) })
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Condition">
        <div>
          {FILTER_CONDITION_OPTIONS.map((opt) => (
            <Checkbox
              key={opt.value}
              label={opt.label}
              dotColor={opt.dotColor}
              count={conditionCounts[opt.value] ?? 0}
              checked={filters.conditions.includes(opt.value)}
              onChange={() =>
                onChange({ conditions: toggle<ItemCondition>(filters.conditions, opt.value) })
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <PriceRange
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onChange={(min, max) => onChange({ minPrice: min, maxPrice: max })}
        />
      </FilterSection>

      <FilterSection title="Pickup Location">
        <div>
          {FILTER_PICKUP_OPTIONS.map((opt) => (
            <Checkbox
              key={opt.value}
              label={opt.label}
              count={pickupCounts[opt.value] ?? 0}
              checked={filters.pickups.includes(opt.value)}
              onChange={() =>
                onChange({ pickups: toggle<PickupFilter>(filters.pickups, opt.value) })
              }
            />
          ))}
        </div>
      </FilterSection>

      <div className="mt-4 space-y-2">
        <Button fullWidth onClick={onApply}>
          Apply Filters
        </Button>
        <Button fullWidth variant="secondary" onClick={onReset}>
          Reset Filters
        </Button>
      </div>
    </aside>
  );
}
