"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useLostFoundAuth } from "@/hooks/useLostFoundAuth";
import { lostFoundService } from "@/services/lostFoundService";
import { MatchQueueEntry } from "@/types/lostFound";

/** "Custodian Queue" (Section 2.3). Only state=queued candidates ever appear here (AC-4/AC-5). */
export default function MatchQueuePage() {
  const router = useRouter();
  const { role, loading: authLoading } = useLostFoundAuth();
  const [queue, setQueue] = useState<MatchQueueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await lostFoundService.matchQueue();
      setQueue(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const decide = async (candidateId: string, decision: "confirm" | "reject") => {
    setBusyId(candidateId);
    try {
      if (decision === "confirm") await lostFoundService.confirmMatch(candidateId);
      else await lostFoundService.rejectMatch(candidateId);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (!authLoading && role === "user") {
    return <div className="p-10 text-center text-sm text-gray-500">Custodian/admin access required.</div>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-xl font-bold text-gray-900">Custodian confirmation queue</h1>

        {!loading && queue.length === 0 && (
          <p className="py-16 text-center text-sm text-gray-500">No candidates waiting for confirmation.</p>
        )}

        <div className="space-y-4">
          {queue.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
              <p className="mb-3 text-sm font-bold text-brand">Score: {item.score.toFixed(2)}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/lost-found/${item.lost_report.id}`)}
                  className="rounded-lg bg-gray-50 p-3 text-left hover:bg-gray-100"
                >
                  <p className="text-[10px] font-bold text-gray-400">LOST</p>
                  <p className="mt-0.5 text-sm font-semibold capitalize text-gray-900">{item.lost_report.category}</p>
                  <p className="mt-1 line-clamp-3 text-xs text-gray-600">{item.lost_report.description}</p>
                  <p className="mt-1 text-[11px] text-gray-400">📍 {item.lost_report.last_seen_location}</p>
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/lost-found/${item.found_report.id}`)}
                  className="rounded-lg bg-gray-50 p-3 text-left hover:bg-gray-100"
                >
                  <p className="text-[10px] font-bold text-gray-400">FOUND</p>
                  <p className="mt-0.5 text-sm font-semibold capitalize text-gray-900">{item.found_report.category}</p>
                  <p className="mt-1 line-clamp-3 text-xs text-gray-600">{item.found_report.description}</p>
                  <p className="mt-1 text-[11px] text-gray-400">📍 {item.found_report.pickup_location}</p>
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button loading={busyId === item.id} onClick={() => decide(item.id, "confirm")}>
                  Confirm match
                </Button>
                <Button variant="secondary" loading={busyId === item.id} onClick={() => decide(item.id, "reject")}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
