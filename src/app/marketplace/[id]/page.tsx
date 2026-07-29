"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TopNav } from "@/components/ui/TopNav";
import { Button } from "@/components/ui/Button";
import { MOCK_LISTINGS } from "@/constants/mockListings";
import { formatINR } from "@/utils/format";
import { FILTER_CATEGORY_OPTIONS, FILTER_CONDITION_OPTIONS } from "@/constants/marketplace";

export default function ListingDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const listing = MOCK_LISTINGS.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="min-h-screen bg-surface">
        <TopNav />
        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Listing not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            This listing may have been removed or sold.
          </p>
          <Link href="/marketplace" className="mt-6 inline-block">
            <Button>Back to Marketplace</Button>
          </Link>
        </main>
      </div>
    );
  }

  const categoryLabel = FILTER_CATEGORY_OPTIONS.find((c) => c.value === listing.category)?.label;
  const conditionLabel = FILTER_CONDITION_OPTIONS.find((c) => c.value === listing.condition)?.label;

  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/marketplace" className="text-sm text-brand hover:underline">
          ← Back to Marketplace
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="relative h-80 w-full overflow-hidden rounded-xl bg-gray-100">
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              sizes="500px"
              className="object-cover"
              unoptimized
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
              <span>{categoryLabel}</span>
              <span>·</span>
              <span>{conditionLabel}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            <p className="mt-2 text-2xl font-bold text-brand">{formatINR(listing.price)}</p>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-800">{listing.sellerName}</p>
              <p className="text-xs text-gray-500">
                {listing.sellerBatch} · Pickup at {listing.location}
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <Button fullWidth>Make an Offer</Button>
              <Button fullWidth variant="secondary">
                Chat with Seller
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-gray-400">
              Make an Offer & Chat arrive in Feature 3.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
