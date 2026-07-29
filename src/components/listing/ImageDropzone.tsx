"use client";

import React, { useCallback, useRef, useState } from "react";

interface ImageDropzoneProps {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
  remainingSlots: number;
}

export function ImageDropzone({
  onFilesSelected,
  disabled,
  remainingSlots,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      if (disabled) return;
      if (e.dataTransfer.files?.length) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [disabled, onFilesSelected]
  );

  const isFull = remainingSlots <= 0;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !isFull) setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      className={[
        "flex h-64 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
        isFull ? "cursor-not-allowed border-gray-200 bg-gray-50" : "cursor-pointer",
        isDragActive ? "border-brand bg-brand-light" : "border-brand/40 bg-brand-light/40",
      ].join(" ")}
      onClick={() => !disabled && !isFull && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-disabled={isFull || disabled}
      aria-label="Upload item photos"
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled && !isFull) {
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg"
        multiple
        hidden
        disabled={disabled || isFull}
        onChange={(e) => {
          if (e.target.files?.length) onFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-brand">
          <path
            d="M12 16V8m0 0l-3.5 3.5M12 8l3.5 3.5M20 16.5V18a2 2 0 01-2 2H6a2 2 0 01-2-2v-1.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {isFull ? (
        <p className="text-sm font-medium text-gray-500">Maximum photos reached</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-gray-800">
            Drag &amp; drop your photos here
          </p>
          <p className="mt-1 text-sm font-medium text-brand">
            or browse files from your computer
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Maximum {remainingSlots} more · JPG, PNG format
          </p>
        </>
      )}
    </div>
  );
}
