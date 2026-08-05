"use client";

import AppLayout from "@/components/layout/AppLayout";
import { Space_Grotesk, Manrope } from "next/font/google";
import React, { useState, useEffect, useRef } from "react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export default function VenturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Find the scrollable parent <main> element
    const scrollContainer = containerRef.current?.closest("main");
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (scrollContainer.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = containerRef.current?.closest("main");
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .ventures-container h1,
        .ventures-container h2,
        .ventures-container h3,
        .ventures-container h4,
        .ventures-container h5,
        .ventures-container .font-display {
          font-family: var(--font-space-grotesk), sans-serif !important;
        }
        .ventures-container,
        .ventures-container p,
        .ventures-container span,
        .ventures-container button,
        .ventures-container input,
        .ventures-container textarea,
        .ventures-container select,
        .ventures-container label,
        .ventures-container table,
        .ventures-container td,
        .ventures-container th {
          font-family: var(--font-manrope), sans-serif !important;
        }
        
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

      {/* Floating Scroll to Top Button */}
      {isVisible && (
        <button
          onClick={scrollToTop}
          title="Scroll to Top"
          className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg border border-orange-500 hover:bg-orange-700 hover:scale-110 active:scale-95 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
        >
          <svg className="h-5 w-5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
