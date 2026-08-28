"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Sparkles, MessageSquare, Tag, Compass, ArrowRight, Eye, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ui/ThemeProvider";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Actions" | "Marketplace" | "Ventures" | "Contacts";
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommandItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const router = useRouter();
  const { activeTheme, setPreference } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Toggle state on CMD/CTRL + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Default core commands
  const defaultCommands: CommandItem[] = useMemo(() => [
    {
      id: "nav-marketplace",
      title: "Go to Marketplace",
      subtitle: "Browse items for sale or post a listing",
      category: "Navigation",
      icon: <Tag size={16} className="text-blue-500" />,
      action: () => { router.push("/marketplace"); setOpen(false); }
    },
    {
      id: "nav-ventures",
      title: "Go to Venture Hub",
      subtitle: "Discover student startups or browse venture feed",
      category: "Navigation",
      icon: <Compass size={16} className="text-orange-500" />,
      action: () => { router.push("/ventures"); setOpen(false); }
    },
    {
      id: "nav-messages",
      title: "Go to Messages",
      subtitle: "Open your active chat conversations",
      category: "Navigation",
      icon: <MessageSquare size={16} className="text-emerald-500" />,
      action: () => { router.push("/messages"); setOpen(false); }
    },
    {
      id: "nav-lostfound",
      title: "Go to Lost & Found",
      subtitle: "Report a lost item or match a claim",
      category: "Navigation",
      icon: <ShieldAlert size={16} className="text-indigo-500" />,
      action: () => { router.push("/lost-found"); setOpen(false); }
    },
    {
      id: "action-theme",
      title: "Toggle Dark Mode",
      subtitle: "Switch between light and dark display theme",
      category: "Actions",
      icon: <Sparkles size={16} className="text-purple-500" />,
      action: () => { setPreference(activeTheme === "dark" ? "light" : "dark"); setOpen(false); }
    }
  ], [router, activeTheme, setPreference]);

  // Fetch search results from DB
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const dbResults: CommandItem[] = [];
      const term = `%${searchQuery}%`;

      // 1. Search listings
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, price, seller_name")
        .ilike("title", term)
        .limit(3);

      (listings || []).forEach((item) => {
        dbResults.push({
          id: `item-${item.id}`,
          title: item.title,
          subtitle: `₹${item.price.toLocaleString("en-IN")} · Sold by ${item.seller_name}`,
          category: "Marketplace",
          icon: <Tag size={16} className="text-blue-400 shrink-0" />,
          action: () => { router.push(`/marketplace/${item.id}`); setOpen(false); }
        });
      });

      // 2. Search ventures
      const { data: ventures } = await supabase
        .from("ventures")
        .select("id, name, category, owner_name")
        .ilike("name", term)
        .limit(3);

      (ventures || []).forEach((v) => {
        dbResults.push({
          id: `venture-${v.id}`,
          title: v.name,
          subtitle: `${v.category} · Founder: ${v.owner_name}`,
          category: "Ventures",
          icon: <Compass size={16} className="text-orange-400 shrink-0" />,
          action: () => { router.push(`/ventures?id=${v.id}`); setOpen(false); }
        });
      });

      // 3. Search conversations
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, buyer_name, seller_name")
        .or(`buyer_name.ilike.${term},seller_name.ilike.${term}`)
        .limit(3);

      (convs || []).forEach((c) => {
        dbResults.push({
          id: `conv-${c.id}`,
          title: `Chat thread`,
          subtitle: `Between ${c.buyer_name} and ${c.seller_name}`,
          category: "Contacts",
          icon: <MessageSquare size={16} className="text-emerald-400 shrink-0" />,
          action: () => { router.push(`/messages?activeId=${c.id}`); setOpen(false); }
        });
      });

      setResults(dbResults);
    } catch (err) {
      console.error("Command palette search error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Debounced search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(query);
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query, performSearch]);

  const activeList = query ? results : defaultCommands;

  // Handle keyboard navigation inside the list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % activeList.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + activeList.length) % activeList.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeList[activeIndex]) {
        activeList[activeIndex].action();
      }
    }
  };

  // Close when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  if (!open) return null;

  // Group items by category for cleaner display
  const categoriesMap = new Map<string, CommandItem[]>();
  activeList.forEach((item) => {
    const list = categoriesMap.get(item.category) || [];
    list.push(item);
    categoriesMap.set(item.category, list);
  });

  const categories = Array.from(categoriesMap.entries());

  // Flattened index mapping helper to sync index to category splits
  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/45 backdrop-blur-[3px] pt-[15vh] px-4 animate-in fade-in duration-150"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[50vh] transform scale-100 animate-in zoom-in-95 duration-200"
      >
        {/* Search Input Bar */}
        <div className="flex h-13 items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search items, ventures, chats, or commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none border-none focus:ring-0 p-0"
          />
          {loading && <Loader2 size={16} className="animate-spin text-gray-400" />}
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            <kbd className="hidden sm:inline-flex h-5 items-center justify-center rounded bg-gray-100 dark:bg-gray-800 px-1.5 text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-700">
              ESC
            </kbd>
          </div>
        </div>

        {/* Command List Area */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[100px]">
          {activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-1 text-center">
              <span className="text-xl">🔍</span>
              <p className="text-xs font-bold text-gray-400">No results found for &quot;{query}&quot;</p>
              <p className="text-[10px] text-gray-400/70">Check spelling or try a navigation shortcut instead.</p>
            </div>
          ) : (
            categories.map(([categoryName, items]) => (
              <div key={categoryName} className="space-y-1">
                {/* Category Header */}
                <div className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {categoryName}
                </div>
                {/* Items */}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const currentFlatIndex = flatIndex;
                    flatIndex++;
                    const isSelected = currentFlatIndex === activeIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        className={[
                          "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group",
                          isSelected
                            ? "bg-brand/10 dark:bg-brand/15 text-gray-900 dark:text-white"
                            : "hover:bg-gray-50 dark:hover:bg-gray-900/40 text-gray-700 dark:text-gray-300"
                        ].join(" ")}
                      >
                        <div className={[
                          "flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 transition-colors shrink-0",
                          isSelected && "bg-white dark:bg-gray-900"
                        ].join(" ")}>
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold truncate leading-snug">
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-medium">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowRight
                          size={14}
                          className={[
                            "text-gray-300 dark:text-gray-600 transition-all shrink-0 opacity-0 group-hover:opacity-100",
                            isSelected && "opacity-100 translate-x-0.5 text-brand"
                          ].join(" ")}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="h-9 px-4 border-t border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 flex items-center justify-between shrink-0 text-[10px] text-gray-400 select-none font-semibold">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span>Enter Select</span>
          </div>
          <div>
            <span>IIM Lucknow Connect</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// React useMemo Helper
import { useMemo } from "react";
