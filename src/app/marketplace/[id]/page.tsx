"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TopNav } from "@/components/ui/TopNav";
import { Button } from "@/components/ui/Button";
import { MakeOfferModal } from "@/components/chat/MakeOfferModal";
import { MOCK_LISTINGS } from "@/constants/mockListings";
import { formatINR } from "@/utils/format";
import { FILTER_CATEGORY_OPTIONS, FILTER_CONDITION_OPTIONS } from "@/constants/marketplace";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const listing = MOCK_LISTINGS.find((l) => l.id === id);
  const [offerOpen, setOfferOpen] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen bg-surface">
        <TopNav />
        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Listing not found</h1>
          <p className="mt-2 text-sm text-gray-500">This listing may have been removed or sold.</p>
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
      <main className="mx-auto max-w-6xl px-6 py-8">
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/marketplace" className="hover:text-brand">Marketplace</Link>
          <span className="mx-2">/</span>
          <span>{categoryLabel}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-gray-100">
              <Image src={listing.imageUrl} alt={listing.title} fill sizes="600px" className="object-cover" unoptimized />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-success shadow-sm">
                {conditionLabel} Condition
              </span>
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand">{categoryLabel}</span>
              <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">{conditionLabel}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            <p className="mt-1 text-sm text-gray-400">Posted {listing.postedAgo}</p>

            <p className="mt-4 text-3xl font-bold text-brand">{formatINR(listing.price)}</p>

            <hr className="my-6 border-gray-100" />

            <h2 className="mb-2 text-sm font-semibold text-gray-900">Description</h2>
            <p className="text-sm leading-relaxed text-gray-600">
              Selling my {listing.title}. Well-maintained and fully functional. Comes as shown in
              the photos. Available for pickup at {listing.location} on campus. Message me to
              arrange a convenient time — happy to answer any questions.
            </p>

            {/* Seller card */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                  {listing.sellerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900">{listing.sellerName}</p>
                    <span className="rounded bg-brand-light px-1.5 py-0.5 text-[10px] font-semibold text-brand">Verified</span>
                  </div>
                  <p className="text-xs text-gray-500">{listing.sellerBatch} · ★ 4.9</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p className="uppercase tracking-wide">Pickup</p>
                <p className="font-medium text-gray-700">{listing.location}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5">
              <Button fullWidth size="lg" onClick={() => setOfferOpen(true)}>
                Make an Offer
              </Button>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => router.push("/messages")}>
                  Chat with Seller
                </Button>
                <Button variant="secondary">Save Listing</Button>
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">
                Secure transaction within IIML Connect. Only verified students can buy and sell.
              </p>
            </div>
          </div>
        </div>
      </main>

      <MakeOfferModal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        listing={{
          title: listing.title,
          askingPrice: listing.price,
          imageUrl: listing.imageUrl,
          sellerName: listing.sellerName,
          sellerRating: 4.9,
        }}
        onSubmit={async () => {
          // In production this posts the offer, then routes into the conversation.
          setOfferOpen(false);
          router.push("/messages");
        }}
      />
    </div>
  );
}
