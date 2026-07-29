"use client";

import React from "react";
import { Conversation } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
}

function Avatar({ color, name }: { color: string; name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-lg font-bold text-gray-900">Messages</h2>
        {conversations.some((c) => c.unreadCount > 0) && (
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">
            {conversations.reduce((n, c) => n + (c.unreadCount > 0 ? 1 : 0), 0)} new
          </span>
        )}
      </div>

      <div className="px-4 pb-3">
        <div className="flex h-9 items-center gap-2 rounded-lg bg-gray-100 px-3">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-gray-400">
            <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-sm text-gray-400">Search conversations...</span>
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {conversations.map((c) => {
          const isActive = c.id === activeId;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={[
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  isActive ? "border-l-2 border-brand bg-brand-light/50" : "border-l-2 border-transparent hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="relative">
                  <Avatar color={c.participant.avatarColor} name={c.participant.name} />
                  {c.participant.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-gray-900">{c.participant.name}</p>
                    <span className="shrink-0 text-[11px] text-gray-400">{c.lastMessageAt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs text-gray-500">{c.lastMessagePreview}</p>
                    {c.unreadCount > 0 && (
                      <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
