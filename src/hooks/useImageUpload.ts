"use client";

import { useCallback } from "react";
import { listingService } from "@/services/listingService";
import { ListingImage } from "@/types";
import { generateId } from "@/utils/format";
import { useListingDraft } from "@/hooks/useListingDraft";
import { MAX_IMAGES } from "@/constants/listing";

interface UseImageUploadResult {
  handleFilesSelected: (files: FileList | File[]) => void;
  retryUpload: (id: string) => void;
  remainingSlots: number;
}

export function useImageUpload(): UseImageUploadResult {
  const { draft, addImages, setImageStatus } = useListingDraft();

  const uploadOne = useCallback(
    async (image: ListingImage) => {
      setImageStatus(image.id, "uploading");
      try {
        const { remoteUrl } = await listingService.uploadImage(image.file);
        setImageStatus(image.id, "uploaded", remoteUrl);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong during upload.";
        setImageStatus(image.id, "error", undefined, message);
      }
    },
    [setImageStatus]
  );

  const handleFilesSelected = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files).slice(
        0,
        Math.max(0, MAX_IMAGES - draft.images.length)
      );
      if (incoming.length === 0) return;

      const newImages: ListingImage[] = incoming.map((file) => ({
        id: generateId(),
        previewUrl: URL.createObjectURL(file),
        file,
        status: "idle",
      }));

      addImages(newImages);
      newImages.forEach((img) => uploadOne(img));
    },
    [addImages, draft.images.length, uploadOne]
  );

  const retryUpload = useCallback(
    (id: string) => {
      const image = draft.images.find((img) => img.id === id);
      if (image) uploadOne(image);
    },
    [draft.images, uploadOne]
  );

  return {
    handleFilesSelected,
    retryUpload,
    remainingSlots: Math.max(0, MAX_IMAGES - draft.images.length),
  };
}
