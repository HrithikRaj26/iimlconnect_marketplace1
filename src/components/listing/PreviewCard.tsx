import Image from "next/image";
import React from "react";
import { ListingDraft } from "@/types";
import { CATEGORY_OPTIONS, CONDITION_OPTIONS, PICKUP_LOCATION_OPTIONS } from "@/constants/listing";
import { formatINR } from "@/utils/format";
import { Chip } from "@/components/ui/Chip";

interface PreviewCardProps {
  draft: ListingDraft;
  variant?: "compact" | "full";
}

export function PreviewCard({ draft, variant = "compact" }: PreviewCardProps) {
  const coverImage = draft.images[0];
  const category = CATEGORY_OPTIONS.find((c) => c.value === draft.category);
  const condition = CONDITION_OPTIONS.find((c) => c.value === draft.condition);
  const pickup = PICKUP_LOCATION_OPTIONS.find((p) => p.value === draft.pickupLocationType);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="relative h-48 w-full bg-gray-100">
        {coverImage ? (
          <Image
            src={coverImage.previewUrl}
            alt={draft.title || "Listing preview"}
            fill
            sizes="400px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No photo yet
          </div>
        )}
        {variant === "full" && draft.images.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            1 / {draft.images.length}
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex flex-wrap gap-2">
          {category && <Chip label={category.label} tone="brand" />}
          {condition && <Chip label={condition.label} tone="success" />}
        </div>

        <h3 className="text-base font-semibold text-gray-900">
          {draft.title || "Untitled item"}
        </h3>

        <p className="text-xl font-bold text-brand">
          {draft.price ? formatINR(draft.price) : "₹—"}
          {draft.negotiable && (
            <span className="ml-2 text-xs font-medium text-gray-400">Offers allowed</span>
          )}
        </p>

        {variant === "full" && draft.description && (
          <>
            <hr className="my-2 border-gray-100" />
            <p className="text-sm text-gray-600">{draft.description}</p>
          </>
        )}

        {pickup && (
          <div className="flex items-center gap-1.5 pt-1 text-xs text-gray-500">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path
                fillRule="evenodd"
                d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>{pickup.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
