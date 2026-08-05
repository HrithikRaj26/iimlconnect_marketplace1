"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { ReportCard } from "@/components/lost-found/ReportCard";
import { useLostFoundAuth } from "@/hooks/useLostFoundAuth";
import { lostFoundService } from "@/services/lostFoundService";
import { CATEGORIES, InstantMatch, ReportSummary } from "@/types/lostFound";

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

export default function LostFoundBrowsePage() {
  const router = useRouter();
  const { userId } = useLostFoundAuth();
  const [tab, setTab] = useState<"lost" | "found" | "mine">("mine");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<InstantMatch[]>([]);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // "matched" is derived client-side (see isEffectivelyMatched), not a
      // real query param — sending it to the API would return nothing.
      const data = await lostFoundService.browse({ category, location, status: status === "matched" ? undefined : status });
      setResults(data);
    } catch (e: any) {
      setError(e.message ?? "Could not load reports");
    } finally {
      setLoading(false);
    }
  }, [category, location, status]);

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
  };
  const statusOptions = tab === "mine" ? MINE_STATUS_OPTIONS : BROWSE_STATUS_OPTIONS;
  const tabResults = (
    tab === "mine"
      ? results.filter((r) => (r.type === "lost" ? r.reporter_id === userId : r.finder_id === userId))
      : results.filter((r) => r.type === tab)
  ).filter((r) => (status === "matched" ? isEffectivelyMatched(r, results, userId) : true));
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
        <aside className="w-full shrink-0 lg:w-64">
          <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold text-gray-900">Filters</h2>

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
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {loading && tabResults.length === 0 && <p className="py-16 text-center text-sm text-gray-500">Loading…</p>}
          {error && <p className="py-4 text-sm font-medium text-red-500">{error}</p>}
          {!loading && tabResults.length === 0 && !error && (
            <p className="py-16 text-center text-sm text-gray-500">
              {tab === "mine" ? "You haven't filed any reports yet." : `No ${tab} reports match these filters.`}
            </p>
          )}

          <div className="rounded-xl bg-brand-light/50 p-4">
            <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {tabResults.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onView={openDetail}
                  onEdit={tab === "mine" ? editReport : undefined}
                  matches={tab === "mine" ? matchesByReportId.get(r.id) : undefined}
                  onViewMatch={openDetail}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
