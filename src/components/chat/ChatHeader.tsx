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
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-5 py-3">
      <div className="flex items-center gap-4">
        {onBack && (
          <button 
            type="button" 
            onClick={onBack}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer mr-1 shrink-0 font-bold text-sm"
          >
            ←
          </button>
        )}
        <div className="flex items-center gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: participant.avatarColor }}
          >
            {participant.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900">{participant.name}</p>
              {participant.verified && (
                <span className="flex items-center gap-0.5 rounded bg-brand-light px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {participant.online ? (
                <span className="text-success">● Online now</span>
              ) : (
                participant.batch
              )}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 border-l border-gray-100 pl-4 sm:flex">
          <div className="relative h-9 w-9 overflow-hidden rounded-md bg-gray-100">
            <Image src={listing.imageUrl} alt="" fill sizes="36px" className="object-cover" unoptimized />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">About this listing</p>
            <p className="text-sm font-semibold text-gray-900">{listing.title}</p>
            <p className="text-xs text-brand">{formatINR(listing.askingPrice)} asking</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {dealClosed ? (
          <span className="flex items-center gap-1 rounded-full bg-success-light px-3 py-1.5 text-sm font-semibold text-success">
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
              className="h-9 rounded-lg border border-brand px-4 text-sm font-semibold text-brand hover:bg-brand-light cursor-pointer"
            >
              Make Offer
            </button>
          )
        )}

        {/* Delete Thread Button */}
        <button
          type="button"
          onClick={onDeleteThread}
          title="Delete entire conversation"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
