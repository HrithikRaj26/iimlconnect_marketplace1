"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ListingWizardShell } from "@/components/listing/ListingWizardShell";
import { ImageUploader } from "@/components/listing/ImageUploader";
import { Button } from "@/components/ui/Button";
import { useListingDraft } from "@/hooks/useListingDraft";
import { validatePhotosStep, hasErrors } from "@/utils/validation";

export default function UploadPhotosStep() {
  const router = useRouter();
  const { draft } = useListingDraft();
  const [error, setError] = useState<string | undefined>();

  const goNext = () => {
    const errors = validatePhotosStep(draft);
    if (hasErrors(errors)) {
      setError(errors.images);
      return;
    }
    const stillUploading = draft.images.some((img) => img.status === "uploading");
    if (stillUploading) {
      setError("Please wait for all photos to finish uploading.");
      return;
    }
    router.push("/listing/create/details");
  };

  return (
    <ListingWizardShell
      currentStep={1}
      footer={
        <>
          <Button variant="secondary" onClick={() => router.push("/marketplace")}>
            Cancel
          </Button>
          <Button onClick={goNext}>Next: Item Details</Button>
        </>
      }
    >
      <ImageUploader error={error} />
    </ListingWizardShell>
  );
}
