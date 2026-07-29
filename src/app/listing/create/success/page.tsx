"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopNav } from "@/components/ui/TopNav";
import { Button } from "@/components/ui/Button";
import { useListingDraft } from "@/hooks/useListingDraft";

export default function ListingSuccessPage() {
  const router = useRouter();
  const { publishedListing, reset } = useListingDraft();

  // If someone lands here without a published listing (e.g. direct URL visit,
  // refresh), send them back to the start of the flow rather than showing a
  // broken success state.
  useEffect(() => {
    if (!publishedListing) {
      router.replace("/listing/create");
    }
  }, [publishedListing, router]);

  if (!publishedListing) return null;

  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-success">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900">Your listing is now live!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Students across the IIM Lucknow campus can now search for and purchase
          your {publishedListing.title}.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Button fullWidth size="lg">
            View Active Listing
          </Button>
          <Button
            variant="secondary"
            fullWidth
            size="lg"
            onClick={() => {
              reset();
              router.push("/listing/create");
            }}
          >
            Create Another Listing
          </Button>
          <Link
            href="/marketplace"
            className="mt-2 text-sm font-medium text-brand hover:underline"
            onClick={() => reset()}
          >
            Return to Marketplace Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
