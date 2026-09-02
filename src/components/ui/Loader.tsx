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
        {/* Rotating track spinner */}
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 dark:border-gray-800 border-t-brand" />
      </div>
      
      {message && (
        <p className="animate-pulse text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase">
          {message}
        </p>
      )}
    </div>
  );
}
