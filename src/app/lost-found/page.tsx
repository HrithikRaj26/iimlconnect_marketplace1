"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { ReportCard } from "@/components/lost-found/ReportCard";
import { lostFoundService } from "@/services/lostFoundService";
import { CATEGORIES, ReportSummary } from "@/types/lostFound";

const STATUS_OPTIONS = ["open", "available", "matched", "resolved"] as const;

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
  const [tab, setTab] = useState<"lost" | "found">("lost");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await lostFoundService.browse({ category, location, status });
      setResults(data);
    } catch (e: any) {
      setError(e.message ?? "Could not load reports");
    } finally {
      setLoading(false);
    }
  }, [category, location, status]);

  useEffect(() => {
    search();
  }, [search]);

  const openDetail = (id: string) => router.push(`/lost-found/${id}`);
  const tabResults = results.filter((r) => r.type === tab);

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl justify-center gap-3 px-6 py-4">
          <Link href="/lost-found/report/lost">
            <Button variant="secondary">Report Lost</Button>
          </Link>
          <Link href="/lost-found/report/found">
            <Button>Report Found</Button>
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl gap-6 px-6">
          <button
            type="button"
            onClick={() => setTab("lost")}
            className={[
              "border-b-2 px-1 py-3 text-sm font-semibold transition-colors",
              tab === "lost" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800",
            ].join(" ")}
          >
            Lost
          </button>
          <button
            type="button"
            onClick={() => setTab("found")}
            className={[
              "border-b-2 px-1 py-3 text-sm font-semibold transition-colors",
              tab === "found" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800",
            ].join(" ")}
          >
            Found
          </button>
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
                {STATUS_OPTIONS.map((s) => (
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
              No {tab} reports match these filters.
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {tabResults.map((r) => (
              <ReportCard key={r.id} report={r} onView={openDetail} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
