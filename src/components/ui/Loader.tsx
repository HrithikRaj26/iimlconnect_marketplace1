"use client";

import React from "react";

interface LoaderProps {
  message?: string;
  className?: string;
  fullscreen?: boolean;
}

export function Loader({
  message = "Loading details...",
  className = "",
  fullscreen = false,
}: LoaderProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-4 text-center",
        fullscreen 
          ? "fixed inset-0 z-[9999] bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md" 
          : "w-full py-16",
        className,
      ].join(" ")}
    >
      <div className="relative flex items-center justify-center">
        {/* Pulsing visual glow backdrop */}
        <div className="absolute h-12 w-12 animate-ping rounded-full bg-brand/10 dark:bg-brand/20 opacity-70 blur-md" />
        
        {/* Rotating track spinner */}
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-brand shadow-sm" />
      </div>
      
      {message && (
        <p className="animate-pulse text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase">
          {message}
        </p>
      )}
    </div>
  );
}
