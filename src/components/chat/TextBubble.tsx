import React from "react";
import { ChatMessage } from "@/types";
import { MessageTicks } from "@/components/chat/MessageTicks";
import { CURRENT_USER_ID } from "@/constants/chat";

interface TextBubbleProps {
  message: ChatMessage;
  time: string;
  onRetry: (id: string) => void;
}

export function TextBubble({ message, time, onRetry }: TextBubbleProps) {
  const isMine = message.authorId === CURRENT_USER_ID;

  return (
    <div className={["flex", isMine ? "justify-end" : "justify-start"].join(" ")}>
      <div className={["max-w-[75%]", isMine ? "items-end" : "items-start"].join(" ")}>
        <div
          className={[
            "rounded-2xl px-4 py-2.5 text-sm",
            isMine
              ? "rounded-br-md bg-brand text-white"
              : "rounded-bl-md border border-gray-200 bg-white text-gray-800",
          ].join(" ")}
        >
          {message.text}
        </div>
        <div
          className={[
            "mt-1 flex items-center gap-1.5 px-1 text-[10px]",
            isMine ? "justify-end text-gray-400" : "text-gray-400",
          ].join(" ")}
        >
          <span>{time}</span>
          {isMine && <MessageTicks status={message.status} />}
        </div>
        {isMine && message.status === "failed" && (
          <button
            type="button"
            onClick={() => onRetry(message.id)}
            className="mt-0.5 px-1 text-[11px] font-semibold text-red-500 underline"
          >
            Tap to retry
          </button>
        )}
      </div>
    </div>
  );
}
