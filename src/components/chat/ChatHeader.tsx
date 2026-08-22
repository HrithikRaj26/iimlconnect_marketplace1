import Image from "next/image";
import React from "react";
import { ChatParticipant, Transaction } from "@/types";
import { formatINR } from "@/utils/format";

interface ChatHeaderProps {
  participant: ChatParticipant;
  listing: { title: string; askingPrice: number; imageUrl: string };
  transaction: Transaction;
  onMakeOffer: () => void;
  onDeleteThread?: () => void;
  onBack?: () => void;
}

export function ChatHeader({ participant, listing, transaction, onMakeOffer, onDeleteThread, onBack }: ChatHeaderProps) {
  const dealClosed = transaction.status === "agreed" || transaction.status === "completed";

  return (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-950 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        {onBack && (
          <button 
            type="button" 
            onClick={onBack}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer shrink-0 transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ring-2 ring-white dark:ring-gray-900"
            style={{ backgroundColor: participant.avatarColor }}
          >
            {participant.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </span>
          {participant.online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-950 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          )}
        </div>

        {/* Name + status */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{participant.name}</p>
            {participant.verified && (
              <span className="flex items-center gap-0.5 rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                IIM
              </span>
            )}
          </div>
          <p className="text-[11px] leading-none mt-0.5">
            {participant.online ? (
              <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active now
              </span>
            ) : (
              <span className="text-gray-400">{participant.batch}</span>
            )}
          </p>
        </div>

        {/* Listing info pill */}
        {listing.title !== "Direct Message" && (
          <div className="hidden items-center gap-2.5 border-l border-gray-100 dark:border-gray-800 pl-4 ml-1 sm:flex">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200 dark:ring-gray-700 shrink-0">
              <Image src={listing.imageUrl} alt="" fill sizes="40px" className="object-cover" unoptimized />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Listing</p>
              <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate max-w-[140px]">{listing.title}</p>
              <p className="text-xs font-semibold text-brand">{formatINR(listing.askingPrice)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2.5">
        {dealClosed ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
            Deal Closed
          </span>
        ) : (
          listing.askingPrice > 0 && (
            <button
              type="button"
              onClick={onMakeOffer}
              className="flex items-center gap-1.5 h-9 rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark transition-all shadow-sm shadow-brand/25 active:scale-95 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Offer
            </button>
          )
        )}

        {/* Delete Thread Button */}
        <button
          type="button"
          onClick={onDeleteThread}
          title="Delete entire conversation"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-400 hover:text-red-600 dark:text-red-500 transition-all active:scale-95 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
