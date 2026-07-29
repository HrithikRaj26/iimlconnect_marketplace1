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
  new: "bg-success-light text-success",
  like_new: "bg-success-light text-success",
  good: "bg-amber-100 text-amber-700",
  fair: "bg-red-100 text-red-600",
};

export function ListingCard({ listing, onView }: ListingCardProps) {
  const categoryLabel =
    FILTER_CATEGORY_OPTIONS.find((c) => c.value === listing.category)?.label ?? listing.category;
  const conditionLabel =
    FILTER_CONDITION_OPTIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card transition-shadow hover:shadow-md">
      <div className="relative h-44 w-full bg-gray-100">
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
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm hover:text-brand"
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
          <span className={["rounded px-2 py-0.5 text-[11px] font-semibold", conditionTone[listing.condition]].join(" ")}>
            {conditionLabel}
          </span>
          <span className="text-[11px] font-medium text-gray-400">{categoryLabel}</span>
        </div>

        <h3 className="text-sm font-semibold text-gray-900">{listing.title}</h3>
        <p className="mt-1 text-base font-bold text-brand">{formatINR(listing.price)}</p>

        <hr className="my-3 border-gray-100" />

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="truncate">
            {listing.sellerName} ({listing.sellerBatch})
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
              <path
                fillRule="evenodd"
                d="M9.69 18.933C9.89 19.02 10 19 10 19s.11.02.31-.067C11.65 18.36 17 15 17 9A7 7 0 103 9c0 6 5.35 9.36 6.69 9.933zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                clipRule="evenodd"
              />
            </svg>
            {listing.location}
          </span>
          <span>{listing.postedAgo}</span>
        </div>

        <button
          type="button"
          onClick={() => onView?.(listing.id)}
          className="mt-3 h-9 w-full rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          View Details
        </button>
      </div>
    </article>
  );
}
