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
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

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
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-72 lg:shrink-0">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onApply={() => setMobileFiltersOpen(false)}
              onReset={resetFilters}
            />
          </div>

          {/* Mobile Filter Drawer */}
          <AnimatePresence>
            {mobileFiltersOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileFiltersOpen(false)}
                  className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm lg:hidden"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 right-0 z-[70] w-full max-w-xs bg-white dark:bg-gray-900 shadow-2xl lg:hidden flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
                    <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <FilterSidebar
                      filters={filters}
                      onChange={setFilters}
                      onApply={() => setMobileFiltersOpen(false)}
                      onReset={resetFilters}
                      isMobile
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

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

      {/* Mobile Floating Action Button (FAB) for Sell an Item */}
      <Link 
        href="/listing/create" 
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl text-white shadow-lg sm:hidden hover:bg-brand-light hover:text-brand transition-colors"
      >
        +
      </Link>
    </div>
  );
}
