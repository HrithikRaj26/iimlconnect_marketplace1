"use client";

import React, { useRef, useState } from "react";
import { ImageDropzone } from "@/components/listing/ImageDropzone";
import { SelectedPhotoItem } from "@/components/listing/SelectedPhotoItem";
import { useListingDraft } from "@/hooks/useListingDraft";
import { useImageUpload } from "@/hooks/useImageUpload";
import { MAX_IMAGES } from "@/constants/listing";

interface ImageUploaderProps {
  error?: string;
}

export function ImageUploader({ error }: ImageUploaderProps) {
  const { draft, removeImage, reorderImages } = useListingDraft();
  const { handleFilesSelected, retryUpload, remainingSlots } = useImageUpload();
  const dragIndex = useRef<number | null>(null);
  const [, forceRerender] = useState(0);

  const onDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const onDragEnter = (index: number) => {
    if (dragIndex.current === null || dragIndex.current === index) return;
    const next = [...draft.images];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(index, 0, moved);
    dragIndex.current = index;
    reorderImages(next);
  };

  const onDragEnd = () => {
    dragIndex.current = null;
    forceRerender((n) => n + 1);
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Upload Item Photos</h2>
        <span className="text-sm text-gray-500">
          Selected Photos ({draft.images.length}/{MAX_IMAGES})
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Great photos make items sell up to 5x faster. Upload clear shots from multiple
        angles.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ImageDropzone
          onFilesSelected={handleFilesSelected}
          remainingSlots={remainingSlots}
        />

        <div className="flex flex-col gap-3">
          {draft.images.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              Your selected photos will appear here. The first photo becomes your
              listing&apos;s cover.
            </div>
          ) : (
            draft.images.map((image, index) => (
              <SelectedPhotoItem
                key={image.id}
                image={image}
                index={index}
                isCover={index === 0}
                onRemove={removeImage}
                onDragStart={onDragStart}
                onDragEnter={onDragEnter}
                onDragEnd={onDragEnd}
                onRetry={retryUpload}
              />
            ))
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
