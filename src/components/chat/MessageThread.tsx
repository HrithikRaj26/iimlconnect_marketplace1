"use client";

import React, { useEffect, useRef } from "react";
import { Conversation } from "@/types";
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

  // Auto-scroll to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages.length, conversation.transaction.status]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 px-5 py-6">
      {dealClosed && (
        <div className="flex items-center gap-3 rounded-xl bg-success px-5 py-3 text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold">Offer Accepted!</p>
            <p className="text-xs text-white/90">
              You and {conversation.participant.name.split(" ")[0]} have agreed on{" "}
              {conversation.transaction.finalAmount
                ? `₹${conversation.transaction.finalAmount.toLocaleString("en-IN")}`
                : "a price"}
              . Coordinate pickup below.
            </p>
          </div>
        </div>
      )}

      {conversation.messages.map((message) => {
        const time = formatTime(message.createdAt);
        if (message.kind === "offer") {
          return (
            <OfferCard
              key={message.id}
              message={message}
              listingTitle={conversation.listing.title}
              time={time}
              onAccept={onAcceptOffer}
              onDecline={onDeclineOffer}
              onCounter={onCounterOffer}
            />
          );
        }
        return (
          <TextBubble 
            key={message.id} 
            message={message} 
            time={time} 
            onRetry={onRetryMessage} 
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
          />
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
