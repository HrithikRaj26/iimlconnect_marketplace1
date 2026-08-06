import Link from "next/link";
import React from "react";
import { MessageSquare } from "lucide-react";

interface TopNavProps {
  /** Which nav item to highlight as active. */
  active?: "marketplace" | "listings" | "messages";
  onMenuClick?: () => void;
}

export function TopNav({ active = "marketplace", onMenuClick }: TopNavProps) {
  const linkClass = (key: TopNavProps["active"]) =>
    key === active ? "text-brand" : "text-gray-500 hover:text-gray-800";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-6">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button onClick={onMenuClick} className="text-gray-500 hover:text-gray-900 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link href="/" className="flex items-center gap-2">
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
          </div>
        </Link>
      </div>

      <nav className="flex items-center gap-4">
        <Link href="/messages" className={linkClass("messages")} title="Messages">
          <MessageSquare className="w-5 h-5 text-gray-500 hover:text-gray-900 transition-colors" />
        </Link>
      </nav>
    </header>
  );
}
