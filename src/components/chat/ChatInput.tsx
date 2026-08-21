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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && !disabled) {
        onSend(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const hasText = value.trim().length > 0;

  return (
    <div className={`border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-3 transition-all duration-200 ${shake ? "animate-shake" : ""}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*,application/pdf"
      />

      <div className={`flex items-end gap-2 rounded-2xl transition-all duration-200 ${
        shake
          ? "ring-2 ring-red-400/50 bg-red-50 dark:bg-red-950/20"
          : isFocused
            ? "ring-2 ring-brand/30 bg-gray-50 dark:bg-gray-800/80"
            : "bg-gray-100 dark:bg-gray-800/60"
        } px-3 py-2.5`}>

        {/* Attach */}
        <button
          type="button"
          onClick={() => !disabled && fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach file"
          title="Attach file or image"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40 transition-all"
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
          placeholder={disabled ? "This deal is closed" : "Message..."}
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
