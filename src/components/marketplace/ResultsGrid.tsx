"use client";

import React from "react";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ListingCardSkeleton } from "@/components/marketplace/ListingCardSkeleton";
import { Button } from "@/components/ui/Button";
import { AsyncStatus, MarketplaceListing } from "@/types";
import { PAGE_SIZE } from "@/constants/marketplace";

interface ResultsGridProps {
  items: MarketplaceListing[];
  status: AsyncStatus;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onResetFilters: () => void;
  onViewListing: (id: string) => void;
}

export function ResultsGrid({
  items,
  status,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  onResetFilters,
  onViewListing,
}: ResultsGridProps) {
  // First-load skeletons: only when we have no items yet and a request is in flight.
  if (status === "loading" && items.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 py-16 text-center">
        <p className="text-sm font-medium text-red-600">
          {error ?? "We couldn't load listings."}
        </p>
        <p className="mt-1 text-sm text-red-500">Check your connection and try again.</p>
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-gray-400">
            <path
              d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900">No listings match your search</h3>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Try adjusting your filters or search terms — or clear everything to see the full
          marketplace.
        </p>
        <Button variant="secondary" className="mt-4" onClick={onResetFilters}>
          Clear all filters
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ListingCard key={item.id} listing={item} onView={onViewListing} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="secondary"
            size="lg"
            loading={status === "loading"}
            onClick={onLoadMore}
          >
            {status === "loading" ? "Loading…" : "Load more listings"}
          </Button>
        </div>
      )}
    </div>
  );
}
