"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface PlatformUser {
  id: string;
  name: string;
  batch: string;
  avatarColor: string;
  source: "listing" | "venture" | "conversation";
}

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserProfile: { name: string; batch: string };
  onStartChat: (user: PlatformUser) => void;
}

const AVATAR_COLORS = [
  "#2563EB", "#D97706", "#059669", "#7C3AED", "#DC2626",
  "#0891B2", "#C2410C", "#4F46E5", "#BE185D", "#065F46",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Initials({ name, color }: { name: string; color: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

export function NewChatModal({
  open,
  onClose,
  currentUserId,
  currentUserProfile,
  onStartChat,
}: NewChatModalProps) {
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all known users from the DB (from listings, ventures, conversations)
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const userMap = new Map<string, PlatformUser>();

      // 1. Users who have listings
      const { data: listings } = await supabase
        .from("listings")
        .select("seller_id, seller_name, seller_batch")
        .neq("seller_id", currentUserId);

      (listings || []).forEach((l) => {
        if (l.seller_id && l.seller_name && !userMap.has(l.seller_id)) {
          userMap.set(l.seller_id, {
            id: l.seller_id,
            name: l.seller_name,
            batch: l.seller_batch || "Student",
            avatarColor: colorForId(l.seller_id),
            source: "listing",
          });
        }
      });

      // 2. Users who own ventures
      const { data: ventures } = await supabase
        .from("ventures")
        .select("owner_id, owner_name")
        .neq("owner_id", currentUserId);

      (ventures || []).forEach((v) => {
        if (v.owner_id && v.owner_name && !userMap.has(v.owner_id)) {
          userMap.set(v.owner_id, {
            id: v.owner_id,
            name: v.owner_name,
            batch: "Venture Founder",
            avatarColor: colorForId(v.owner_id),
            source: "venture",
          });
        }
      });

      // 3. Users we've previously conversed with
      const { data: convs } = await supabase
        .from("conversations")
        .select("buyer_id, buyer_name, buyer_batch, seller_id, seller_name, seller_batch")
        .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`);

      (convs || []).forEach((c) => {
        const otherId = c.buyer_id === currentUserId ? c.seller_id : c.buyer_id;
        const otherName = c.buyer_id === currentUserId ? c.seller_name : c.buyer_name;
        const otherBatch = c.buyer_id === currentUserId ? c.seller_batch : c.buyer_batch;
        if (otherId && otherName && !userMap.has(otherId)) {
          userMap.set(otherId, {
            id: otherId,
            name: otherName,
            batch: otherBatch || "Student",
            avatarColor: colorForId(otherId),
            source: "conversation",
          });
        }
      });

      const sorted = Array.from(userMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setAllUsers(sorted);
    } catch (e) {
      console.error("Error loading users:", e);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (open) {
      setQuery("");
      loadUsers();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, loadUsers]);

  const filtered = allUsers.filter((u) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.batch.toLowerCase().includes(q)
    );
  });

  const handleSelect = (user: PlatformUser) => {
    onStartChat(user);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Start a new conversation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">New Message</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {allUsers.length > 0 ? `${allUsers.length} people on platform` : "Search people on IIML Connect"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex h-10 items-center gap-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 px-3.5 focus-within:ring-2 focus-within:ring-brand/30 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-gray-400 shrink-0">
              <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or batch..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400 border-none focus:ring-0 p-0"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="shrink-0 text-gray-400 hover:text-gray-600">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3" role="status">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
              <p className="text-xs font-semibold text-gray-400">Finding people...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-3xl">🔍</span>
              <p className="text-sm font-bold text-gray-400">
                {query ? `No one found for "${query}"` : "No users found"}
              </p>
              <p className="text-xs text-gray-400 max-w-xs text-center leading-relaxed">
                Only people who have listed items, registered ventures, or chatted before appear here.
              </p>
            </div>
          ) : (
            <ul className="py-2">
              {/* Section: Previous conversations */}
              {!query && filtered.some((u) => u.source === "conversation") && (
                <li className="px-4 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/80 dark:bg-gray-800/40">
                  Recent Contacts
                </li>
              )}
              {filtered
                .filter((u) => !query || true)
                .map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(user)}
                      className="flex w-full items-center gap-3.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left group active:scale-[0.99]"
                    >
                      <Initials name={user.name} color={user.avatarColor} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                          {user.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {user.batch}
                          </span>
                          {user.source === "venture" && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full" aria-label="Founder badge">
                              Founder
                            </span>
                          )}
                          {user.source === "listing" && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full" aria-label="Seller badge">
                              Seller
                            </span>
                          )}
                          {user.source === "conversation" && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full" aria-label="Contact badge">
                              Contact
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
