import Image from "next/image";
import React from "react";
import { MarketplaceListing } from "@/types";
import { formatINR } from "@/utils/format";
import { FILTER_CATEGORY_OPTIONS, FILTER_CONDITION_OPTIONS } from "@/constants/marketplace";

interface ListingCardProps {
  listing: MarketplaceListing;
  onView?: (id: string) => void;
}

const conditionTone: Record<string, string> = {
  new: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
  like_new: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
  good: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
  fair: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60",
};

export function ListingCard({ listing, onView }: ListingCardProps) {
  const categoryLabel =
    FILTER_CATEGORY_OPTIONS.find((c) => c.value === listing.category)?.label ?? listing.category;
  const conditionLabel =
    FILTER_CONDITION_OPTIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-800">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover"
          unoptimized
        />
        <button
          type="button"
          aria-label="Save listing"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-300 shadow-xs hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M12 21s-7.5-4.6-10-9.2C.6 9 1.7 5.5 4.8 4.8 6.9 4.3 9 5.5 12 8c3-2.5 5.1-3.7 7.2-3.2C22.3 5.5 23.4 9 22 11.8 19.5 16.4 12 21 12 21z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className={["rounded px-2 py-0.5 text-[11px] font-semibold", conditionTone[listing.condition] || "bg-gray-100 text-gray-700"].join(" ")}>
            {conditionLabel}
          </span>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">{categoryLabel}</span>
        </div>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{listing.title}</h3>
        <p className="mt-1 text-base font-bold text-blue-600 dark:text-blue-400">{formatINR(listing.price)}</p>

        <hr className="my-3 border-gray-100 dark:border-gray-800" />

        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span className="truncate">
            {listing.sellerName} ({listing.sellerBatch})
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1 truncate">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0">
              <path
                fillRule="evenodd"
                d="M9.69 18.933C9.89 19.02 10 19 10 19s.11.02.31-.067C11.65 18.36 17 15 17 9A7 7 0 103 9c0 6 5.35 9.36 6.69 9.933zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="truncate">{listing.location}</span>
          </span>
          <span className="shrink-0">{listing.postedAgo}</span>
        </div>

        <button
          type="button"
          onClick={() => onView?.(listing.id)}
          className="mt-3.5 h-9 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          View Details
        </button>
      </div>
    </article>
  );
}
