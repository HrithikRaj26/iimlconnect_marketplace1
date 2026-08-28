"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { ReportCard } from "@/components/lost-found/ReportCard";
import { Loader } from "@/components/ui/Loader";
import { useLostFoundAuth } from "@/hooks/useLostFoundAuth";
import { lostFoundService } from "@/services/lostFoundService";
import { CATEGORIES, InstantMatch, ReportSummary } from "@/types/lostFound";
import Fuse from "fuse.js";
import { Mic, X } from "lucide-react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { AnimatePresence, motion } from "framer-motion";

// "available" is redundant with "open" (both just mean "still active") and
// is dropped entirely. "matched" only makes sense as a My Reports filter —
// it's meaningless on the public Lost/Found tabs, which show everyone's
// reports rather than reports you have a stake in.
const BROWSE_STATUS_OPTIONS = ["open", "resolved"] as const;
const MINE_STATUS_OPTIONS = ["open", "resolved", "matched"] as const;

/**
 * The DB 'matched' status is only ever set by the custodian-confirmed-match
 * flow (matching.ts's decide()) — the self-service claim flow (claimItem/
 * resolve in reports.ts) never touches it, going straight from open/
 * available to resolved. Since almost all real usage is self-service, a
 * literal `status === 'matched'` filter would show nothing. This instead
 * derives "matched" from the same signal the self-service flow itself uses:
 * a found report with a claimant that isn't resolved yet, and for the
 * paired lost report, a same-category found report claimed by this user.
 */
function isEffectivelyMatched(report: ReportSummary, allResults: ReportSummary[], userId: string | undefined): boolean {
  if (report.status === "matched") return true;
  if (report.status === "resolved" || report.status === "archived") return false;
  if (report.type === "found") return !!report.claimant_id;
  return allResults.some(
    (r) => r.type === "found" && r.claimant_id === userId && r.category === report.category && r.status !== "resolved" && r.status !== "archived",
  );
}

function DateRangeField({
  label,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  label: string;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  const inputClass =
    "h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20";
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-800">{label}</label>
      <div className="flex items-center gap-2">
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className={inputClass} aria-label={`${label} from`} />
        <span className="shrink-0 text-xs text-gray-400">to</span>
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className={inputClass} aria-label={`${label} to`} />
      </div>
    </div>
  );
}

// ISO date/timestamp strings sort lexically the same as chronologically, so
// slicing to the date-only prefix and comparing as strings avoids a Date
// parse for every report on every render.
function inDateRange(value: string | null | undefined, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!value) return true; // nothing to compare against — don't exclude reports that just lack the field
  const d = value.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
        active ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// useSearchParams() requires a Suspense boundary above it during static
// prerendering, or the build fails outright — this wrapper is that
// boundary; all the actual page logic stays in the inner component.
export default function LostFoundBrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <LostFoundBrowsePageInner />
    </Suspense>
  );
}

function LostFoundBrowsePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useLostFoundAuth();
  
  const initialTab = (searchParams.get("tab") as "lost" | "found" | "mine") || "mine";
  const [tab, setTab] = useState<"lost" | "found" | "mine">(initialTab);
  
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { isListening, startListening } = useVoiceSearch(setSearchQuery);

  // Sync tab state if URL changes
  useEffect(() => {
    const urlTab = searchParams.get("tab") as "lost" | "found" | "mine";
    if (urlTab && ["lost", "found", "mine"].includes(urlTab) && urlTab !== tab) {
      setTab(urlTab);
    }
  }, [searchParams]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [mineTypeFilter, setMineTypeFilter] = useState<"" | "lost" | "found">("");
  const [lostDateFrom, setLostDateFrom] = useState("");
  const [lostDateTo, setLostDateTo] = useState("");
  const [foundDateFrom, setFoundDateFrom] = useState("");
  const [foundDateTo, setFoundDateTo] = useState("");
  const [createdDateFrom, setCreatedDateFrom] = useState("");
  const [createdDateTo, setCreatedDateTo] = useState("");
  const [results, setResults] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<InstantMatch[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Status filtering happens entirely client-side (see matchesStatus)
      // rather than as a query param — lost reports use 'open' and found
      // reports use 'available' for the same "still active" state, and the
      // server-side .eq('status', ...) filter can't express "either of
      // these", so passing it through would silently drop one whole type.
      const data = await lostFoundService.browse({ category, location });
      setResults(data);
    } catch (e: any) {
      setError(e.message ?? "Could not load reports");
    } finally {
      setLoading(false);
    }
  }, [category, location]);

  const loadMatches = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await lostFoundService.myMatches();
      setMatches(data);
    } catch {
      setMatches([]);
    }
  }, [userId]);

  useEffect(() => {
    search();
  }, [search]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Reports and matches are fetched once per mount, so a change made
  // elsewhere (another tab/account, or a delete on the edit page) can go
  // stale here. Refetch whenever the tab regains focus/visibility instead
  // of requiring a manual hard refresh.
  useEffect(() => {
    const refresh = () => {
      search();
      loadMatches();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [search, loadMatches]);

  const openDetail = (id: string) => router.push(`/lost-found/${id}`);
  const editReport = (id: string) => router.push(`/lost-found/edit/${id}`);
  const switchTab = (next: "lost" | "found" | "mine") => {
    setTab(next);
    setStatus(undefined); // status pills differ per tab, so a stale selection could silently filter to nothing
    setMineTypeFilter(""); // the Lost/Found pill only exists on the My Reports tab
    // Each tab only shows its own date filter (Lost Date / Found Date /
    // Report Created Date), so clear all three on switch — otherwise a
    // filter set on one tab would keep silently narrowing another tab's
    // results with no visible control to explain why.
    setLostDateFrom("");
    setLostDateTo("");
    setFoundDateFrom("");
    setFoundDateTo("");
    setCreatedDateFrom("");
    setCreatedDateTo("");
  };
  const statusOptions = tab === "mine" ? MINE_STATUS_OPTIONS : BROWSE_STATUS_OPTIONS;
  // "Open" covers both a lost report's 'open' status and a found report's
  // 'available' status — they mean the same thing ("still active, not yet
  // resolved") on the two different tables, just spelled differently.
  const matchesStatus = (r: ReportSummary): boolean => {
    if (!status) return true;
    if (status === "matched") return isEffectivelyMatched(r, results, userId);
    if (status === "open") return r.status === "open" || r.status === "available";
    return r.status === status;
  };
  // Found reports have no field for "the day it was found" distinct from
  // when the report was filed, so "Found Date" filters on created_at for
  // found reports — the same field "Report Created Date" also uses, just
  // scoped to one type. Each date filter only constrains the report type
  // it actually applies to; reports of the other type pass through
  // unaffected by it.
  const matchesDates = (r: ReportSummary): boolean => {
    if (r.type === "lost" && !inDateRange(r.lost_date, lostDateFrom, lostDateTo)) return false;
    if (r.type === "found" && !inDateRange(r.created_at, foundDateFrom, foundDateTo)) return false;
    if (!inDateRange(r.created_at, createdDateFrom, createdDateTo)) return false;
    return true;
  };
  // "My Reports" is reports you authored (filed the lost report / found the
  // item) — a found report you merely claimed was filed by someone else and
  // doesn't belong here, even though claiming it is what makes your own
  // lost report of the same category start showing as "Matched" (see
  // isEffectivelyMatched's lost-report branch above, which cross-references
  // the full `results` set rather than depending on tab membership).
  const isOwnReport = (r: ReportSummary) => (r.type === "lost" ? r.reporter_id === userId : r.finder_id === userId);
  const isMineTabMember = isOwnReport;
  // My Reports mixes both report types, so it gets its own Lost/Found pill
  // to narrow down to one — a no-op outside that tab since mineTypeFilter
  // only gets set there and is reset on every tab switch.
  const matchesMineType = (r: ReportSummary): boolean => !mineTypeFilter || r.type === mineTypeFilter;

  let tabResults = (tab === "mine" ? results.filter(isMineTabMember) : results.filter((r) => r.type === tab))
    .filter(matchesStatus)
    .filter(matchesDates)
    .filter(matchesMineType);

  if (searchQuery.trim()) {
    const fuse = new Fuse(tabResults, {
      keys: ['category', 'description', 'last_seen_location', 'pickup_location', 'status'],
      threshold: 0.4,
    });
    tabResults = fuse.search(searchQuery.trim()).map(r => r.item);
  }

  const matchesByReportId = new Map<string, InstantMatch[]>();
  for (const m of matches) {
    const list = matchesByReportId.get(m.sourceReportId) ?? [];
    list.push(m);
    matchesByReportId.set(m.sourceReportId, list);
  }
  for (const list of matchesByReportId.values()) list.sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-0">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => switchTab("lost")}
              className={[
                "border-b-2 px-1 py-3 text-sm font-semibold transition-colors",
                tab === "lost" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800",
              ].join(" ")}
            >
              Lost
            </button>
            <button
              type="button"
              onClick={() => switchTab("found")}
              className={[
                "border-b-2 px-1 py-3 text-sm font-semibold transition-colors",
                tab === "found" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800",
              ].join(" ")}
            >
              Found
            </button>
            <button
              type="button"
              onClick={() => switchTab("mine")}
              className={[
                "border-b-2 px-1 py-3 text-sm font-semibold transition-colors",
                tab === "mine" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800",
              ].join(" ")}
            >
              My Reports
            </button>
          </div>

          <div className="flex justify-center gap-3 pb-1 sm:justify-end sm:pb-0">
            <Link href="/lost-found/report/lost">
              <Button variant="secondary">Report Lost</Button>
            </Link>
            <Link href="/lost-found/report/found">
              <Button>Report Found</Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-full shrink-0 lg:w-64">
          <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold text-gray-900">Filters</h2>

            <TextInput
              label="Search (Keywords)"
              placeholder="E.g. spiderman wallet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              actionButton={
                <button
                  type="button"
                  onClick={startListening}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  title="Voice Search"
                >
                  <Mic size={16} strokeWidth={2} />
                </button>
              }
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 capitalize outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <TextInput
              label="Location"
              placeholder="Contains…"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">Status</label>
              <div className="flex flex-wrap gap-2">
                <FilterPill active={!status} onClick={() => setStatus(undefined)}>
                  All
                </FilterPill>
                {statusOptions.map((s) => (
                  <FilterPill key={s} active={status === s} onClick={() => setStatus(s)}>
                    {s}
                  </FilterPill>
                ))}
              </div>
            </div>

            {tab === "mine" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Report Type</label>
                <div className="flex flex-wrap gap-2">
                  <FilterPill active={!mineTypeFilter} onClick={() => setMineTypeFilter("")}>
                    All
                  </FilterPill>
                  <FilterPill active={mineTypeFilter === "lost"} onClick={() => setMineTypeFilter("lost")}>
                    Lost
                  </FilterPill>
                  <FilterPill active={mineTypeFilter === "found"} onClick={() => setMineTypeFilter("found")}>
                    Found
                  </FilterPill>
                </div>
              </div>
            )}

            {tab === "lost" && (
              <DateRangeField label="Lost Date" from={lostDateFrom} to={lostDateTo} onFromChange={setLostDateFrom} onToChange={setLostDateTo} />
            )}
            {tab === "found" && (
              <DateRangeField label="Found Date" from={foundDateFrom} to={foundDateTo} onFromChange={setFoundDateFrom} onToChange={setFoundDateTo} />
            )}
            {tab === "mine" && (
              <DateRangeField
                label="Report Created Date"
                from={createdDateFrom}
                to={createdDateTo}
                onFromChange={setCreatedDateFrom}
                onToChange={setCreatedDateTo}
              />
            )}
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFiltersOpen(false)}
                className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-[70] w-full max-w-xs bg-white dark:bg-gray-900 shadow-2xl lg:hidden flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
                  <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  <TextInput
                    label="Search (Keywords)"
                    placeholder="E.g. spiderman wallet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-300">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white capitalize outline-none transition-colors"
                    >
                      <option value="">All categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="capitalize">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <TextInput
                    label="Location"
                    placeholder="Contains…"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-300">Status</label>
                    <div className="flex flex-wrap gap-2">
                      <FilterPill active={!status} onClick={() => setStatus(undefined)}>All</FilterPill>
                      {statusOptions.map((s) => (
                        <FilterPill key={s} active={status === s} onClick={() => setStatus(s)}>{s}</FilterPill>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 pb-[env(safe-area-inset-bottom)]">
                  <Button fullWidth onClick={() => setMobileFiltersOpen(false)}>Apply Filters</Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <div className="lg:hidden flex justify-between items-center mb-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {loading && tabResults.length === 0 ? "Loading..." : `${tabResults.length} Reports`}
            </h1>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 shadow-sm"
            >
              Filters
            </button>
          </div>
          {loading && tabResults.length === 0 && <Loader message="Loading reports..." />}
          {error && <p className="py-4 text-sm font-medium text-red-500">{error}</p>}
          {!loading && tabResults.length === 0 && !error && (
            <p className="py-16 text-center text-sm text-gray-500">
              {tab === "mine" ? "You haven't filed any reports yet." : `No ${tab} reports match these filters.`}
            </p>
          )}

          <div className="rounded-xl bg-brand-light/50 p-4">
            {/*
              A uniform CSS grid sizes every row to its tallest cell, so a
              card with a match banner (much taller than a plain card) left
              a large blank gap under every shorter card sharing its row.
              CSS multi-column layout packs each card right under the one
              above it in the same column instead, so height differences
              between cards no longer leave gaps — the standard no-JS
              masonry trick.
            */}
            <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
              {tabResults.map((r) => (
                <div key={r.id} className="mb-5 break-inside-avoid">
                  <ReportCard
                    report={r}
                    onView={openDetail}
                    onEdit={tab === "mine" && isOwnReport(r) ? editReport : undefined}
                    matches={tab === "mine" ? matchesByReportId.get(r.id) : undefined}
                    onViewMatch={openDetail}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
