"use client";

import React, { useState, useRef } from "react";

interface ChatInputProps {
  onSend: (text: string) => Promise<boolean> | boolean | void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
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
    // Clear input
    e.target.value = "";
  };

  return (
    <div className={`flex items-center gap-2 border-t border-gray-100 bg-white px-4 py-3 transition-all duration-200 ${
      shake ? "animate-shake ring-2 ring-red-500/30 rounded-t-xl bg-red-50/10" : ""
    }`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*,application/pdf"
      />
      <button
        type="button"
        onClick={() => !disabled && fileInputRef.current?.click()}
        disabled={disabled}
        aria-label="Attach file"
        title="Attach file or image"
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 disabled:opacity-50"
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

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={disabled ? "This deal is closed" : "Type a message..."}
        disabled={disabled}
        aria-label="Message"
        className={`h-11 flex-1 rounded-full px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-all duration-200 ${
          shake ? "bg-red-50/30 border-red-300 focus:ring-red-500/20" : "bg-gray-100 focus:ring-brand/20"
        } focus:ring-2 disabled:opacity-60`}
      />

      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className={`flex h-11 w-11 items-center justify-center rounded-full text-white transition-all duration-200 ${
          shake ? "bg-red-500 hover:bg-red-600 shadow-red-500/10" : "bg-brand hover:bg-brand-dark disabled:bg-brand/40"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
