"use client";

import React from "react";
import { Conversation, ChatMessage, Transaction } from "@/types";
import { formatINR } from "@/utils/format";
import { CURRENT_USER_ID } from "@/constants/chat";
import { TransactionAgreementCard } from "@/components/chat/TransactionAgreementCard";

interface NegotiationSidebarProps {
  conversation: Conversation;
  transaction: Transaction;
  onAcceptOffer: (messageId: string) => void;
  onDeclineOffer: (messageId: string) => void;
  onCounterOffer: () => void;
  onMakeOffer: () => void;
}

export function NegotiationSidebar({
  conversation,
  transaction,
  onAcceptOffer,
  onDeclineOffer,
  onCounterOffer,
  onMakeOffer,
}: NegotiationSidebarProps) {
  const dealClosed = transaction.status === "agreed" || transaction.status === "completed";

  // Find the latest offer in message history
  const latestOfferMessage = [...(conversation.messages || [])]
    .reverse()
    .find((m) => m.kind === "offer");

  const activeOffer = latestOfferMessage?.offer;
  const isOfferAuthorCurrentUser = latestOfferMessage?.authorId === CURRENT_USER_ID;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950 p-6">
      {/* 1. Sticky Pinned Item Details */}
      <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
          Linked Item
        </h3>
        <div className="flex gap-4">
          {conversation.listing.imageUrl ? (
            <img
              src={conversation.listing.imageUrl}
              alt={conversation.listing.title}
              className="h-16 w-16 rounded-xl object-cover border border-gray-200 dark:border-gray-800 shadow-sm shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-2xl shrink-0">
              📦
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {conversation.listing.title}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Asking Price:{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {formatINR(conversation.listing.askingPrice)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Dedicate Negotiation State Panel */}
      <div className="flex-1 space-y-6">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Transaction Status
          </h3>

          {/* Deal Closed State */}
          {dealClosed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 p-3.5 text-green-700 dark:text-green-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold shrink-0">
                  ✓
                </span>
                <span className="text-xs font-bold">Deal Completed & Agreed</span>
              </div>
              <TransactionAgreementCard
                transaction={transaction}
                itemTitle={conversation.listing.title}
                sellerName={conversation.participant.name}
                sellerBatch={conversation.participant.batch}
              />
            </div>
          ) : activeOffer && activeOffer.status === "pending" ? (
            /* Pending Offer Card */
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  {isOfferAuthorCurrentUser ? "Awaiting Response" : "Offer Received"}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Active Offer</span>
              </div>

              <div>
                <p className="text-3xl font-bold font-serif text-gray-900 dark:text-gray-100">
                  {formatINR(activeOffer.amount)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
                  {isOfferAuthorCurrentUser
                    ? "You sent this offer. The other party needs to review it."
                    : `${conversation.participant.name.split(" ")[0]} offered this price.`}
                </p>
              </div>

              {/* Action Buttons for Incoming Offer */}
              {!isOfferAuthorCurrentUser && (
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onAcceptOffer(latestOfferMessage.id)}
                    className="w-full h-10 rounded-xl bg-success text-sm font-bold text-white hover:bg-success/95 active:scale-95 transition-all"
                  >
                    Accept Offer
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onDeclineOffer(latestOfferMessage.id)}
                      className="flex-1 h-10 rounded-xl border border-red-200 dark:border-red-900/30 bg-white dark:bg-gray-900 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={onCounterOffer}
                      className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80 active:scale-95 transition-all"
                    >
                      Counter
                    </button>
                  </div>
                </div>
              )}

              {isOfferAuthorCurrentUser && (
                <div className="rounded-lg bg-white dark:bg-gray-900 p-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 text-center border border-gray-100 dark:border-gray-800">
                  Waiting for {conversation.participant.name.split(" ")[0]} to accept, decline, or counter.
                </div>
              )}
            </div>
          ) : (
            /* No Active Offer State */
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-850 p-6 text-center space-y-4">
              <span className="block text-3xl">🤝</span>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">No active negotiations</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto leading-normal">
                  Make an offer to suggest a price and coordinate logistics details.
                </p>
              </div>
              <button
                type="button"
                onClick={onMakeOffer}
                className="w-full h-10 rounded-xl bg-brand text-xs font-bold text-white hover:bg-brand-dark active:scale-95 transition-all shadow-sm"
              >
                Make an Offer
              </button>
            </div>
          )}
        </div>

        {/* Informative guidelines */}
        {!dealClosed && (
          <div className="rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50/55 dark:bg-gray-900/20 p-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
              Secure Transactions Guide
            </h4>
            <ul className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400 list-disc pl-4 leading-normal">
              <li>Always meet in well-lit public campus locations.</li>
              <li>Inspect items before finalizing payment.</li>
              <li>Accepting an offer creates a mutually binding campus agreement.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
