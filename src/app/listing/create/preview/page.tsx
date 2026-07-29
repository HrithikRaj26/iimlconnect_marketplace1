"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ListingWizardShell } from "@/components/listing/ListingWizardShell";
import { PreviewCard } from "@/components/listing/PreviewCard";
import { Button } from "@/components/ui/Button";
import { useListingDraft } from "@/hooks/useListingDraft";
import { listingService } from "@/services/listingService";
import { AsyncStatus } from "@/types";

export default function PreviewPublishStep() {
  const router = useRouter();
  const { draft, setPublishedListing } = useListingDraft();
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePublish = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const imageUrls = draft.images
        .map((img) => img.remoteUrl)
        .filter((url): url is string => Boolean(url));

      const published = await listingService.publishListing(draft, imageUrls);
      setPublishedListing(published);
      setStatus("success");
      router.push("/listing/create/success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to publish listing. Please try again."
      );
    }
  };

  return (
    <ListingWizardShell
      currentStep={4}
      footer={
        <>
          <Button
            variant="secondary"
            disabled={status === "loading"}
            onClick={() => router.push("/listing/create/pricing")}
          >
            Edit Listing
          </Button>
          <Button
            variant="success"
            loading={status === "loading"}
            onClick={handlePublish}
          >
            {status === "loading" ? "Publishing…" : "Publish Listing"}
          </Button>
        </>
      }
    >
      <div className="mx-auto max-w-md">
        <h2 className="mb-4 text-center text-base font-semibold text-gray-900">
          Preview &amp; Publish
        </h2>
        <PreviewCard draft={draft} variant="full" />

        <div className="mt-4 rounded-lg bg-white p-4 text-sm text-gray-600 shadow-card">
          <p className="font-medium text-gray-800">Seller</p>
          <p>Aditya S. · Batch of 2026</p>
        </div>

        {status === "error" && errorMessage && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
      </div>
    </ListingWizardShell>
  );
}
