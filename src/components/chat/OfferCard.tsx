import React from "react";
import { ChatMessage } from "@/types";
import { formatINR } from "@/utils/format";
import { CURRENT_USER_ID } from "@/constants/chat";

interface OfferCardProps {
  message: ChatMessage;
  listingTitle: string;
  time: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCounter: (id: string) => void;
}

export function OfferCard({
  message,
  listingTitle,
  time,
  onAccept,
  onDecline,
  onCounter,
}: OfferCardProps) {
  const offer = message.offer!;
  const isMine = message.authorId === CURRENT_USER_ID;
  const align = isMine ? "justify-end" : "justify-start";

  // ── Declined ───────────────────────────────────────────────────────────────
  if (offer.status === "declined") {
    return (
      <div className={["flex", align].join(" ")}>
        <div className="w-64 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 shadow-xs">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Offer Declined
            </span>
            <span className="text-[10px] text-red-400 dark:text-red-500">{time}</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatINR(offer.amount)}</p>
          <p className="text-xs text-red-500 dark:text-red-400">
            {isMine ? "You offered" : "Offered"} · {listingTitle}
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">This offer was declined by the seller.</p>
        </div>
      </div>
    );
  }

  // ── Accepted ─────────────────────────────────────────────────────────────────
  if (offer.status === "accepted") {
    return (
      <div className={["flex", align].join(" ")}>
        <div className="w-64 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 shadow-xs">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Offer Accepted
            </span>
            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500">{time}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatINR(offer.amount)}</p>
          <p className="text-xs text-emerald-600/90 dark:text-emerald-400">
            {isMine ? "You offered" : "Offered"} · {listingTitle}
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
            Deal confirmed — both parties agreed
          </p>
        </div>
      </div>
    );
  }

  // ── Pending, sent by me (awaiting response) ─────────────────────────────────
  if (isMine && offer.status === "pending") {
    return (
      <div className="flex justify-end">
        <div className="w-64 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 shadow-xs">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Offer Sent
            </span>
            <span className="text-[10px] text-amber-500 dark:text-amber-400">{time}</span>
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{formatINR(offer.amount)}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400">You offered · {listingTitle}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Awaiting seller&apos;s response…</p>
        </div>
      </div>
    );
  }

  // ── Pending, received (counter/incoming offer needing my action) ────────────
  return (
    <div className="flex justify-start">
      <div className="w-72 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 p-4 shadow-xs">
        <div className="mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            {message.text ? "Counter Offer" : "New Offer"}
          </span>
          <span className="text-[10px] text-blue-500/70 dark:text-blue-400">{time}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatINR(offer.amount)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Seller offered · {listingTitle}</p>

        <div className="mt-3 flex gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => onAccept(message.id)}
            className="h-8 flex-1 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onDecline(message.id)}
            className="h-8 flex-1 rounded-lg border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => onCounter(message.id)}
            className="h-8 flex-1 rounded-lg border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          >
            Counter
          </button>
        </div>
        <p className="mt-2 hidden lg:block text-[10px] text-gray-400 dark:text-gray-500 italic">
          Review this offer in the Negotiation Panel on the right.
        </p>
      </div>
    </div>
  );
}
