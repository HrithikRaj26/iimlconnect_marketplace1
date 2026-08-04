"use client";

import React, { useRef, useState } from "react";

interface PhotoFieldProps {
  file: File | null;
  onChange: (file: File | null) => void;
  label: string;
}

/** Single-photo picker, styled after ImageDropzone.tsx's dashed-border convention but simplified (no multi/reorder). */
export function PhotoField({ file, onChange, label }: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    onChange(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-800">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className="flex h-40 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-brand/40 bg-brand-light/40 transition-colors hover:border-brand"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Selected" className="h-full w-full object-cover" />
        ) : (
          <p className="text-sm font-medium text-brand-dark">Tap to add a photo</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {file && (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setPreview(null);
          }}
          className="mt-1.5 text-xs font-medium text-red-500 hover:text-red-600"
        >
          Remove photo
        </button>
      )}
    </div>
  );
}
