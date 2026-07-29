"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchService } from "@/services/searchService";
import { MarketplaceFilters, MarketplaceListing, AsyncStatus } from "@/types";
import { DEFAULT_FILTERS, PAGE_SIZE } from "@/constants/marketplace";

interface UseMarketplaceSearchResult {
  filters: MarketplaceFilters;
  setFilters: (updater: Partial<MarketplaceFilters>) => void;
  resetFilters: () => void;
  items: MarketplaceListing[];
  total: number;
  status: AsyncStatus;
  error: string | null;
  loadMore: () => void;
  hasMore: boolean;
  retry: () => void;
}

export function useMarketplaceSearch(): UseMarketplaceSearchResult {
  const [filters, setFiltersState] = useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Tracks the latest request so out-of-order responses can't overwrite newer results.
  const requestId = useRef(0);

  const runSearch = useCallback(
    async (activeFilters: MarketplaceFilters, activePage: number) => {
      const currentRequest = ++requestId.current;
      setStatus("loading");
      setError(null);
      try {
        const result = await searchService.search(activeFilters, activePage);
        if (currentRequest !== requestId.current) return; // stale response, ignore
        setItems(result.items);
        setTotal(result.total);
        setStatus("success");
      } catch (err) {
        if (currentRequest !== requestId.current) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    },
    []
  );

  // Debounce filter changes for instant-search-as-you-type without hammering the service.
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      runSearch(filters, 1);
    }, 300);
    return () => clearTimeout(handle);
  }, [filters, runSearch]);

  const setFilters = useCallback((updater: Partial<MarketplaceFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...updater }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    runSearch(filters, nextPage);
  }, [page, filters, runSearch]);

  const retry = useCallback(() => {
    runSearch(filters, page);
  }, [filters, page, runSearch]);

  const hasMore = items.length < total;

  return {
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
  };
}
