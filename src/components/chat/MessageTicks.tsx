import React from "react";
import { MessageStatus } from "@/types";

export function MessageTicks({ status }: { status: MessageStatus }) {
  if (status === "sending") {
    return <span className="text-[10px] text-white/70">Sending…</span>;
  }
  if (status === "failed") {
    return <span className="text-[10px] text-red-200">Failed</span>;
  }

  const isRead = status === "read";
  const isDouble = status === "delivered" || status === "read";

  return (
    <span
      className={["inline-flex items-center", isRead ? "text-sky-400" : "text-white/50"].join(" ")}
      aria-label={status}
    >
      <svg viewBox="0 0 20 16" fill="none" className="h-3.5 w-4">
        <path d="M1 8l3.5 3.5L11 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {isDouble && (
          <path d="M7 11l1 1L15 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  );
}
