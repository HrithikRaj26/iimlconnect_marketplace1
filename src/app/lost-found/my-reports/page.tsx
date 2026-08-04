"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReportCard } from "@/components/lost-found/ReportCard";
import { useLostFoundAuth } from "@/hooks/useLostFoundAuth";
import { lostFoundService } from "@/services/lostFoundService";
import { ReportSummary } from "@/types/lostFound";

/**
 * "My Reports". The browse endpoint has no `mine=` filter (matches the
 * original React Native build's Section 2.4 note), so this filters
 * client-side on reporter_id/finder_id — fine at campus/semester scale.
 */
export default function MyReportsPage() {
  const router = useRouter();
  const { userId, loading: authLoading } = useLostFoundAuth();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const all = await lostFoundService.browse({});
      setReports(all.filter((r) => (r.type === "lost" ? r.reporter_id === userId : r.finder_id === userId)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-6 text-xl font-bold text-gray-900">My reports</h1>

        {!loading && reports.length === 0 && (
          <p className="py-16 text-center text-sm text-gray-500">You haven&apos;t filed any reports yet.</p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} onView={(id) => router.push(`/lost-found/${id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}
