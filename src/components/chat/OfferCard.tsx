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
        <div className="w-64 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Offer Declined
            </span>
            <span className="text-[10px] text-red-300">{time}</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{formatINR(offer.amount)}</p>
          <p className="text-xs text-red-400">
            {isMine ? "You offered" : "Offered"} · {listingTitle}
          </p>
          <p className="mt-2 text-xs text-red-400">This offer was declined by the seller.</p>
        </div>
      </div>
    );
  }

  // ── Accepted ─────────────────────────────────────────────────────────────────
  if (offer.status === "accepted") {
    return (
      <div className={["flex", align].join(" ")}>
        <div className="w-64 rounded-2xl border border-success/40 bg-success-light p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Offer Accepted
            </span>
            <span className="text-[10px] text-success/60">{time}</span>
          </div>
          <p className="text-2xl font-bold text-success">{formatINR(offer.amount)}</p>
          <p className="text-xs text-success/80">
            {isMine ? "You offered" : "Offered"} · {listingTitle}
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs font-medium text-success">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
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
        <div className="w-64 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Offer Sent
            </span>
            <span className="text-[10px] text-amber-400">{time}</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatINR(offer.amount)}</p>
          <p className="text-xs text-amber-500">You offered · {listingTitle}</p>
          <p className="mt-2 text-xs text-amber-500">Awaiting seller&apos;s response…</p>
        </div>
      </div>
    );
  }

  // ── Pending, received (counter/incoming offer needing my action) ────────────
  return (
    <div className="flex justify-start">
      <div className="w-72 rounded-2xl border border-brand/30 bg-brand-light/60 p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand">
            <span className="h-2 w-2 rounded-full bg-brand" />
            {message.text ? "Counter Offer" : "New Offer"}
          </span>
          <span className="text-[10px] text-brand/50">{time}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatINR(offer.amount)}</p>
        <p className="text-xs text-gray-500">Seller offered · {listingTitle}</p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onAccept(message.id)}
            className="h-8 flex-1 rounded-lg bg-success text-xs font-semibold text-white hover:bg-success/90"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onDecline(message.id)}
            className="h-8 flex-1 rounded-lg border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => onCounter(message.id)}
            className="h-8 flex-1 rounded-lg border border-brand/30 text-xs font-semibold text-brand hover:bg-brand-light"
          >
            Counter
          </button>
        </div>
      </div>
    </div>
  );
}
