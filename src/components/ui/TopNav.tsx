import Link from "next/link";
import React from "react";

interface TopNavProps {
  /** Which nav item to highlight as active. */
  active?: "marketplace" | "listings" | "messages";
}

export function TopNav({ active = "marketplace" }: TopNavProps) {
  const linkClass = (key: TopNavProps["active"]) =>
    key === active ? "text-brand" : "text-gray-500 hover:text-gray-800";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-6">
      <Link href="/marketplace" className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 12l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-gray-900">
            IIML <span className="text-brand">Connect</span>
          </p>
          <p className="text-[10px] tracking-wide text-gray-400">STUDENT MARKETPLACE</p>
        </div>
      </Link>

      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
        <Link href="/marketplace" className={linkClass("marketplace")}>
          Marketplace
        </Link>
        <Link href="/listing/create" className={linkClass("listings")}>
          Sell an Item
        </Link>
        <span className="cursor-not-allowed text-gray-300">Messages</span>
      </nav>

      <div className="ml-6 flex items-center gap-2">
        <span className="h-8 w-8 overflow-hidden rounded-full bg-gray-200" aria-hidden="true" />
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-semibold text-gray-800">Aditya S.</p>
          <p className="text-[11px] text-gray-400">Batch of 2026</p>
        </div>
      </div>
    </header>
  );
}
