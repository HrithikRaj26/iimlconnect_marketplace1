"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const styles: React.CSSProperties = {
    width,
    height,
  };

  return (
    <div
      className={[
        "animate-pulse bg-gray-200 dark:bg-gray-800/80",
        variant === "circular" ? "rounded-full" : variant === "text" ? "rounded-md h-4 my-1.5" : "rounded-xl",
        className,
      ].join(" ")}
      style={styles}
      role="progressbar"
      aria-busy="true"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading content..."
    />
  );
}

export function SkeletonListingDetail() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8 animate-fade-in">
      {/* Back button */}
      <Skeleton width={100} height={36} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Photo Gallery */}
        <div className="space-y-4">
          <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
          <div className="flex gap-3">
            <Skeleton className="w-20 h-20 rounded-xl" />
            <Skeleton className="w-20 h-20 rounded-xl" />
            <Skeleton className="w-20 h-20 rounded-xl" />
          </div>
        </div>

        {/* Details Column */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton width="80%" height={32} />
            <Skeleton width="40%" height={28} />
          </div>

          <div className="flex items-center gap-3 py-4 border-t border-b border-gray-100 dark:border-gray-800">
            <Skeleton variant="circular" width={44} height={44} />
            <div className="space-y-2 flex-1">
              <Skeleton width="40%" height={16} />
              <Skeleton width="25%" height={12} />
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-[90%]" />
            <Skeleton variant="text" className="w-[85%]" />
          </div>

          <div className="pt-4">
            <Skeleton width="100%" height={48} className="rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonConversations() {
  return (
    <div className="flex flex-1 overflow-hidden h-screen bg-white dark:bg-gray-950 animate-fade-in">
      {/* Sidebar List */}
      <div className="w-full md:w-96 shrink-0 border-r border-gray-100 dark:border-gray-800 p-4 space-y-4 hidden md:block">
        <div className="flex items-center justify-between">
          <Skeleton width={100} height={28} />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
        <Skeleton width="100%" height={40} className="rounded-xl" />
        <div className="flex gap-2">
          <Skeleton width={50} height={26} className="rounded-full" />
          <Skeleton width={70} height={26} className="rounded-full" />
          <Skeleton width={60} height={26} className="rounded-full" />
        </div>
        <div className="space-y-4 pt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="space-y-2 flex-1 pt-1">
                <div className="flex justify-between">
                  <Skeleton width="50%" height={14} />
                  <Skeleton width={40} height={10} />
                </div>
                <Skeleton width="80%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="h-[68px] border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="space-y-2">
              <Skeleton width={120} height={14} />
              <Skeleton width={80} height={10} />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton width={70} height={36} className="rounded-xl" />
            <Skeleton width={36} height={36} className="rounded-xl" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex justify-start">
            <Skeleton width="45%" height={60} className="rounded-2xl rounded-bl-sm" />
          </div>
          <div className="flex justify-end">
            <Skeleton width="35%" height={48} className="rounded-2xl rounded-br-sm" />
          </div>
          <div className="flex justify-start">
            <Skeleton width="50%" height={72} className="rounded-2xl rounded-bl-sm" />
          </div>
          <div className="flex justify-end">
            <Skeleton width="40%" height={50} className="rounded-2xl rounded-br-sm" />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <Skeleton width="100%" height={44} className="rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
