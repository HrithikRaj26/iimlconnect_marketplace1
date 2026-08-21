import React, { useState } from "react";
import { Conversation } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
}

function Avatar({ color, name, size = "md" }: { color: string; name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const sizeClass = size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md ${sizeClass}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "active">("all");

  const searchFiltered = conversations.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const participantName = (c.participant?.name || "").toLowerCase();
    const listingTitle = (c.listing?.title || "").toLowerCase();
    const lastMsg = (c.lastMessagePreview || "").toLowerCase();
    const batch = (c.participant?.batch || "").toLowerCase();
    return participantName.includes(query) || listingTitle.includes(query) || lastMsg.includes(query) || batch.includes(query);
  });

  const filteredConversations = searchFiltered.filter((c) => {
    if (activeFilter === "unread") return c.unreadCount > 0;
    if (activeFilter === "active") return c.participant.online === true;
    return true;
  });

  const totalUnread = conversations.reduce((n, c) => n + (c.unreadCount > 0 ? 1 : 0), 0);
  const totalActive = conversations.filter((c) => c.participant.online).length;

  const filters: { key: "all" | "unread" | "active"; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread", count: totalUnread },
    { key: "active", label: "Active", count: totalActive },
  ];

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Messages</h2>
          {totalUnread > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-extrabold text-white shadow-sm shadow-brand/40">
              {totalUnread}
            </span>
          )}
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-brand-light hover:text-brand transition-all text-xs font-bold"
          title="New conversation"
        >
          ✏️
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex h-10 items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800/80 px-3.5 border border-transparent focus-within:border-brand/30 focus-within:bg-white dark:focus-within:bg-gray-800 focus-within:shadow-sm transition-all duration-200">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-gray-400 shrink-0">
            <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400 border-none p-0 focus:ring-0 focus:outline-none font-medium"
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery("")}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-[10px] font-bold hover:bg-gray-400 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all duration-150 ${
              activeFilter === f.key
                ? "bg-brand text-white shadow-sm shadow-brand/30"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold ${
                activeFilter === f.key ? "bg-white/25 text-white" : "bg-brand text-white"
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <ul className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/60">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-2xl">
              {activeFilter === "unread" ? "✅" : activeFilter === "active" ? "👥" : "💬"}
            </div>
            <p className="text-sm font-semibold text-gray-400">
              {searchQuery
                ? "No matches found"
                : activeFilter === "unread"
                  ? "No unread messages"
                  : activeFilter === "active"
                    ? "No active users right now"
                    : "No conversations yet"}
            </p>
            {activeFilter !== "all" && !searchQuery && (
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="text-xs font-bold text-brand hover:underline"
              >
                Show all conversations
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.id === activeId;
            const hasUnread = c.unreadCount > 0;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={[
                    "relative flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-all duration-200 group",
                    isActive
                      ? "bg-brand/10 dark:bg-brand/15"
                      : hasUnread
                        ? "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/40",
                  ].join(" ")}
                >
                  {/* Active bar */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-brand" />
                  )}
                  {/* Unread bar */}
                  {!isActive && hasUnread && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-brand/60" />
                  )}

                  {/* Avatar + online dot */}
                  <div className="relative shrink-0">
                    <Avatar color={c.participant.avatarColor} name={c.participant.name} />
                    {c.participant.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-950 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <p className={`truncate text-[13.5px] leading-snug ${
                        hasUnread
                          ? "font-extrabold text-gray-900 dark:text-white"
                          : isActive
                            ? "font-bold text-gray-900 dark:text-white"
                            : "font-semibold text-gray-700 dark:text-gray-200"
                      }`}>
                        {c.participant.name}
                      </p>
                      <span className={`shrink-0 text-[11px] tabular-nums ${
                        hasUnread ? "font-bold text-brand" : "text-gray-400"
                      }`}>
                        {c.lastMessageAt}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-xs leading-relaxed ${
                        hasUnread
                          ? "font-semibold text-gray-700 dark:text-gray-300"
                          : "text-gray-400 dark:text-gray-500"
                      }`}>
                        {c.lastMessagePreview}
                      </p>
                      {hasUnread && (
                        <span className="shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-extrabold text-white shadow-sm shadow-brand/30">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    {/* Listing pill */}
                    <p className="mt-0.5 truncate text-[10px] text-gray-400/70 dark:text-gray-600">
                      📦 {c.listing?.title}
                    </p>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
