"use client";

import AppLayout from "@/components/layout/AppLayout";
import React, { useRef } from "react";

export default function VenturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Hide scrollbar utility for horizontal category scroll lists */
        .scrollbar-hide::-webkit-scrollbar {
          display: none !important;
        }
        .scrollbar-hide {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />
      <AppLayout>
        <div ref={containerRef} className="ventures-container h-full w-full">
          {children}
        </div>
      </AppLayout>
      {/* Scroll-to-top is handled by AppLayout with orange gradient for /ventures */}
    </div>
  );
}
