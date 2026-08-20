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
  const msgText = message.text || "";

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
          {msgText.startsWith("data:image/") || (msgText.startsWith("http") && (msgText.match(/\.(jpeg|jpg|gif|png|webp)/i))) ? (
            <div className="overflow-hidden rounded-lg max-w-full">
              <img src={msgText} alt="Attachment" className="max-h-60 max-w-full rounded-lg object-cover" />
            </div>
          ) : msgText.startsWith("data:") ? (
            <div className="flex items-center gap-2 py-1">
              <span className="text-2xl">📁</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold truncate max-w-[150px]">Attachment File</span>
                <a
                  href={msgText}
                  download="attachment"
                  className={["text-xs underline font-black", isMine ? "text-blue-100 hover:text-white" : "text-brand hover:text-brand-dark"].join(" ")}
                >
                  Download
                </a>
              </div>
            </div>
          ) : (
            msgText
          )}
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
