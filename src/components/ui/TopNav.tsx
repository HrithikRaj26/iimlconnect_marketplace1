import React from "react";

export function TopNav() {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-6">
      <div className="flex items-center gap-2">
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
      </div>

      <div className="hidden flex-1 justify-center px-8 md:flex">
        <div className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg bg-gray-100 px-3">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-gray-400">
            <path
              d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm text-gray-400">Search books, cycles, electronics...</span>
        </div>
      </div>

      <nav className="hidden items-center gap-6 text-sm font-medium text-gray-500 md:flex">
        <span className="cursor-pointer hover:text-gray-800">Marketplace</span>
        <span className="cursor-pointer text-brand">My Listings</span>
        <span className="cursor-pointer hover:text-gray-800">Messages</span>
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
