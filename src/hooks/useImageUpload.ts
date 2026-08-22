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

async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> {
  // Only compress images, skip animated GIFs
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
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
    async (files: FileList | File[]) => {
      const incoming = Array.from(files).slice(
        0,
        Math.max(0, MAX_IMAGES - draft.images.length)
      );
      if (incoming.length === 0) return;

      const compressedImages: ListingImage[] = await Promise.all(
        incoming.map(async (file) => {
          const compressed = await compressImage(file);
          return {
            id: generateId(),
            previewUrl: URL.createObjectURL(compressed),
            file: compressed,
            status: "idle",
          };
        })
      );

      addImages(compressedImages);
      compressedImages.forEach((img) => uploadOne(img));
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
