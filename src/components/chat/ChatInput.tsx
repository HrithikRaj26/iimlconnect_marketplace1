"use client";

import React, { useState, useRef } from "react";

interface ChatInputProps {
  onSend: (text: string) => Promise<boolean> | boolean | void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    previewUrl: string;
    type: "image" | "pdf" | "other";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const compressChatImage = async (file: File, maxWidth = 850, maxHeight = 850, quality = 0.7): Promise<File> => {
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
              resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
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
  };

  const submit = async () => {
    if (disabled) return;
    
    if (pendingFile) {
      const targetFile = pendingFile.type === "image"
        ? await compressChatImage(pendingFile.file)
        : pendingFile.file;

      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === "string" && !disabled) {
          try {
            await onSend(reader.result);
            if (value.trim()) {
              await onSend(value.trim());
              setValue("");
            }
          } catch (err) {
            console.error("Failed to send attachment:", err);
            setShake(true);
            setTimeout(() => setShake(false), 450);
          }
        }
      };
      reader.readAsDataURL(targetFile);
      URL.revokeObjectURL(pendingFile.previewUrl);
      setPendingFile(null);
    } else {
      const trimmed = value.trim();
      if (!trimmed) return;
      try {
        const res = await onSend(trimmed);
        if (res !== false) {
          setValue("");
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 450);
        }
      } catch (err) {
        console.error(err);
        setShake(true);
        setTimeout(() => setShake(false), 450);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: "image" | "pdf" | "other" = "other";
    if (file.type.startsWith("image/")) {
      type = "image";
    } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      type = "pdf";
    }

    setPendingFile({
      file,
      previewUrl: URL.createObjectURL(file),
      type,
    });
    e.target.value = "";
  };

  const hasText = value.trim().length > 0 || pendingFile !== null;

  return (
    <div className={`border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-3 transition-all duration-200 ${shake ? "animate-shake" : ""}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*,application/pdf"
      />

      {/* Pending Attachment Preview Card */}
      {pendingFile && (
        <div className="mb-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            {pendingFile.type === "image" ? (
              <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
                <img src={pendingFile.previewUrl} alt="Pending preview" className="h-full w-full object-cover" />
              </div>
            ) : pendingFile.type === "pdf" ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-150 dark:bg-gray-800 text-gray-500 shrink-0">
                📁
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{pendingFile.file.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                {(pendingFile.file.size / (1024 * 1024)).toFixed(2)} MB · Ready to send
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(pendingFile.previewUrl);
              setPendingFile(null);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Cancel attachment"
          >
            ✕
          </button>
        </div>
      )}

      <div className={`flex items-end gap-2 rounded-2xl transition-all duration-200 ${
        shake
          ? "ring-2 ring-red-400/50 bg-red-50 dark:bg-red-950/20"
          : isFocused
            ? "ring-2 ring-brand/30 bg-gray-50 dark:bg-gray-850"
            : "bg-gray-100 dark:bg-gray-800/60"
        } px-3 py-2.5`}>

        {/* Attach */}
        <button
          type="button"
          onClick={() => !disabled && fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach file"
          title="Attach file or image"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white dark:hover:bg-gray-750 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={disabled ? "This deal is closed" : pendingFile ? "Add a message or press send..." : "Message..."}
          disabled={disabled}
          aria-label="Message"
          className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400 border-none p-0 focus:ring-0 py-0.5 disabled:opacity-60 font-medium min-w-0"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !hasText}
          aria-label="Send message"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 active:scale-90 ${
            shake
              ? "bg-red-500 shadow-md shadow-red-500/30"
              : hasText
                ? "bg-brand hover:bg-brand-dark shadow-md shadow-brand/30 scale-100"
                : "bg-gray-300 dark:bg-gray-700 scale-90"
          } disabled:opacity-50`}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 translate-x-px">
            <path
              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Footer hint */}
      {!disabled && (
        <p className="text-center text-[10px] text-gray-300 dark:text-gray-700 font-medium mt-1.5 select-none">
          Press Enter to send · IIM Lucknow Connect
        </p>
      )}
    </div>
  );
}
