"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopNav } from "@/components/ui/TopNav";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { FilterSidebar } from "@/components/marketplace/FilterSidebar";
import { ResultsGrid } from "@/components/marketplace/ResultsGrid";
import { SortDropdown } from "@/components/marketplace/SortDropdown";
import { Button } from "@/components/ui/Button";
import { useMarketplaceSearch } from "@/hooks/useMarketplaceSearch";

export default function MarketplacePage() {
  const router = useRouter();
  const {
    filters,
    setFilters,
    resetFilters,
    items,
    total,
    status,
    error,
    loadMore,
    hasMore,
    retry,
  } = useMarketplaceSearch();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      {/* Search + sell row */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <div className="flex-1">
            <SearchBar
              value={filters.query}
              onChange={(query) => setFilters({ query })}
            />
          </div>
          <Link href="/listing/create" className="hidden sm:block">
            <Button size="lg">+ Sell an Item</Button>
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Results header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">
              {status === "loading" && items.length === 0 ? "Searching…" : `${total} Listings Found`}
            </h1>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((o) => !o)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 lg:hidden"
            >
              Filters
            </button>
          </div>
          <SortDropdown value={filters.sort} onChange={(sort) => setFilters({ sort })} />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar — always visible on desktop, toggle on mobile */}
          <div className={["lg:w-72 lg:shrink-0", mobileFiltersOpen ? "block" : "hidden lg:block"].join(" ")}>
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onApply={() => setMobileFiltersOpen(false)}
              onReset={resetFilters}
            />
          </div>

          {/* Results */}
          <div className="min-w-0 flex-1">
            <ResultsGrid
              items={items}
              status={status}
              error={error}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onRetry={retry}
              onResetFilters={resetFilters}
              onViewListing={(id) => router.push(`/marketplace/${id}`)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
