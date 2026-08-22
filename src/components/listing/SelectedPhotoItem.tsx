"use client";

import Image from "next/image";
import React from "react";
import { ListingImage } from "@/types";

interface SelectedPhotoItemProps {
  image: ListingImage;
  index: number;
  isCover: boolean;
  onRemove: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  onRetry: (id: string) => void;
}

export function SelectedPhotoItem({
  image,
  isCover,
  onRemove,
  index,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onRetry,
}: SelectedPhotoItemProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={[
        "flex items-center gap-3 rounded-xl border bg-white p-3 shadow-card transition-opacity",
        isCover ? "border-brand" : "border-gray-200",
      ].join(" ")}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab text-gray-300 hover:text-gray-400 active:cursor-grabbing"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M7 4a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zm-6 5a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
      </button>

      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={image.remoteUrl || image.previewUrl}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
          unoptimized
        />
        {image.status === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {isCover && (
          <span className="mb-1 inline-block rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Cover Photo
          </span>
        )}
        <p className="truncate text-sm text-gray-600">{image.file?.name || "Uploaded Photo"}</p>
        {image.status === "error" && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs font-medium text-red-500">{image.errorMessage}</p>
            <button
              type="button"
              onClick={() => onRetry(image.id)}
              className="text-xs font-semibold text-brand underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          aria-label={`Remove ${image.file?.name || "Photo"}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
