"use client";

import React, { useEffect, useRef } from "react";
import { Conversation, ChatMessage } from "@/types";
import { TextBubble } from "@/components/chat/TextBubble";
import { OfferCard } from "@/components/chat/OfferCard";
import { TransactionAgreementCard } from "@/components/chat/TransactionAgreementCard";
import { formatTime } from "@/utils/format";

interface MessageThreadProps {
  conversation: Conversation;
  onRetryMessage: (id: string) => void;
  onAcceptOffer: (id: string) => void;
  onDeclineOffer: (id: string) => void;
  onCounterOffer: (id: string) => void;
  onEditMessage?: (id: string, text: string) => void;
  onDeleteMessage?: (id: string) => void;
}

function getDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4 select-none">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
      <span className="shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wide">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
    </div>
  );
}

export function MessageThread({
  conversation,
  onRetryMessage,
  onAcceptOffer,
  onDeclineOffer,
  onCounterOffer,
  onEditMessage,
  onDeleteMessage,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const dealClosed =
    conversation.transaction.status === "agreed" ||
    conversation.transaction.status === "completed";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages.length, conversation.transaction.status]);

  const messages = conversation.messages;

  // Empty thread state
  if (messages.length === 0 && !dealClosed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-6 py-12 gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-4xl shadow-inner">
          💬
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Start a conversation with {conversation.participant.name.split(" ")[0]}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">
            Ask about the listing, negotiate a price, or just say hi. Your messages are private.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-400 shadow-sm">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {conversation.participant.name.split(" ")[0]} is active now
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 px-4 py-5">
      {dealClosed && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500 px-5 py-3.5 text-white mb-4 shadow-md shadow-emerald-500/20">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold">Deal Agreed! 🎉</p>
            <p className="text-xs text-white/80">
              You and {conversation.participant.name.split(" ")[0]} agreed on{" "}
              {conversation.transaction.finalAmount
                ? `₹${conversation.transaction.finalAmount.toLocaleString("en-IN")}`
                : "a price"}
              . Coordinate pickup below.
            </p>
          </div>
        </div>
      )}

      {messages.map((message, idx) => {
        const time = formatTime(message.createdAt);
        const prevMessage = messages[idx - 1];

        // Show date separator when the calendar day changes between messages
        const showDateSep = idx === 0 ||
          getDateLabel(message.createdAt) !== getDateLabel(prevMessage.createdAt);

        return (
          <React.Fragment key={message.id}>
            {showDateSep && <DateSeparator label={getDateLabel(message.createdAt)} />}
            <div className="py-0.5">
              {message.kind === "offer" ? (
                <OfferCard
                  message={message}
                  listingTitle={conversation.listing.title}
                  time={time}
                  onAccept={onAcceptOffer}
                  onDecline={onDeclineOffer}
                  onCounter={onCounterOffer}
                />
              ) : (
                <TextBubble
                  message={message}
                  time={time}
                  onRetry={onRetryMessage}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                />
              )}
            </div>
          </React.Fragment>
        );
      })}

      {dealClosed && (
        <TransactionAgreementCard
          transaction={conversation.transaction}
          itemTitle={conversation.listing.title}
          sellerName={conversation.participant.name}
          sellerBatch={conversation.participant.batch}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
