"use client";

import Image from "next/image";
import React, { useState } from "react";
import { InstantMatch, ReportSummary } from "@/types/lostFound";
import { Modal } from "@/components/ui/Modal";

const statusTone: Record<string, string> = {
  open: "bg-brand-light text-brand-dark",
  available: "bg-brand-light text-brand-dark",
  matched: "bg-amber-100 text-amber-700",
  resolved: "bg-success-light text-success",
  archived: "bg-gray-100 text-gray-500",
};

// A sensitive matched found item is always physically deposited at PGP
// Office regardless of anything else, so it's never a clickable link. A
// sensitive matched lost report is different — sensitivity alone doesn't
// block viewing it, only the owner's own "withhold from public" choice
// does (the detail page 404s for non-owners in that case). So a sensitive
// but still-public lost report gets the normal clickable button.
function isMatchBlocked(match: InstantMatch): boolean {
  if (!match.isSensitive) return false;
  if (match.matchedType === "found") return true;
  return !match.visibleToPublic;
}

function sensitiveMatchLabel(match: InstantMatch): string {
  return match.matchedType === "found" ? "Collect from PGP Office" : "Owner Notified";
}

function MatchBreakdown({ match }: { match: InstantMatch }) {
  return (
    <ul className="mt-1.5 space-y-0.5 text-[11px] text-amber-800">
      <li>{match.categoryMatch ? "Match" : "No match"} — Category {match.categoryMatch ? "matches" : "differs"} ({match.category})</li>
      <li>{match.locationScore > 0 ? "Match" : "No match"} — Location similarity: {Math.round(match.locationScore * 100)}% ({match.location})</li>
      <li>{match.descriptionScore > 0 ? "Match" : "No match"} — Description similarity: {Math.round(match.descriptionScore * 100)}%</li>
    </ul>
  );
}

export function ReportCard({
  report,
  onView,
  onEdit,
  matches,
  onViewMatch,
}: {
  report: ReportSummary;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  matches?: InstantMatch[];
  onViewMatch?: (id: string) => void;
}) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [dismissedMatchIds, setDismissedMatchIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("iiml-dismissed-matches");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleDismissMatch = (matchedReportId: string) => {
    const updated = [...dismissedMatchIds, matchedReportId];
    setDismissedMatchIds(updated);
    try {
      localStorage.setItem("iiml-dismissed-matches", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const activeMatches = matches?.filter((m) => !dismissedMatchIds.includes(m.matchedReportId));
  const location = report.type === "lost" ? report.last_seen_location : report.found_location || report.pickup_location;
  const topMatch = activeMatches?.[0];

  return (
    <article
      className="flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
    >
      <div className="relative h-40 w-full bg-gray-100 dark:bg-gray-800">
        {report.photo_url ? (
          <Image
            src={report.photo_url}
            alt={report.category}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {report.is_sensitive ? "Photo restricted" : "No photo"}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
            report.type === "lost" 
              ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50" 
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
          }`}>
            {report.type === "lost" ? "Lost" : "Found"}
          </span>
        </div>

        <h3 className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">{report.category}</h3>
        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">Location: {location}</p>

        <div className="mt-3 flex items-center gap-2">
          <span className={["rounded px-2 py-0.5 text-[11px] font-semibold capitalize", statusTone[report.status] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"].join(" ")}>
            {report.status}
          </span>
          {report.is_sensitive && (
            <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40">Sensitive</span>
          )}
          {topMatch && (
            <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
              {Math.round(topMatch.score * 100)}% match
            </span>
          )}
        </div>

        {topMatch && activeMatches && (
          <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 p-3">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              This {report.type} report may match{" "}
              {activeMatches.length > 1 ? `${activeMatches.length} different ${topMatch.matchedType} reports` : `a ${topMatch.matchedType} report`}
            </p>
            <MatchBreakdown match={topMatch} />
            {activeMatches.length > 1 ? (
              <button
                type="button"
                onClick={() => setOverlayOpen(true)}
                className="mt-2 h-8 w-full rounded-lg bg-amber-500 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
              >
                View all {activeMatches.length} {topMatch.matchedType} matches
              </button>
            ) : isMatchBlocked(topMatch) ? (
              <div className="mt-2 flex h-8 w-full items-center justify-center rounded-lg bg-gray-200 text-xs font-semibold text-gray-600">
                {sensitiveMatchLabel(topMatch)}
              </div>
            ) : (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onViewMatch?.(topMatch.matchedReportId)}
                  className="h-8 flex-1 rounded-lg bg-amber-500 text-[11px] font-semibold text-white transition-colors hover:bg-amber-600 cursor-pointer animate-in fade-in duration-200"
                >
                  View Item →
                </button>
                <button
                  type="button"
                  onClick={() => handleDismissMatch(topMatch.matchedReportId)}
                  className="h-8 px-3 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 text-[11px] font-bold transition-colors cursor-pointer"
                  title="Dismiss Match"
                >
                  ✕ Dismiss
                </button>
              </div>
            )}
          </div>
        )}

        {activeMatches && activeMatches.length > 1 && topMatch && (
          <Modal open={overlayOpen} onClose={() => setOverlayOpen(false)} labelledBy="matches-overlay-title">
            <div className="max-h-[80vh] overflow-y-auto p-5">
              <h2 id="matches-overlay-title" className="mb-1 text-base font-bold text-gray-900 capitalize">
                {topMatch.matchedType} reports matching your {report.category} ({report.type} report)
              </h2>
              <p className="mb-3 text-xs text-gray-500">
                Every item below is a <span className="font-semibold capitalize">{topMatch.matchedType}</span> report — pick the one that&apos;s actually yours.
              </p>
              <div className="space-y-3">
                {activeMatches.map((m) => (
                  <div key={m.matchedReportId} className="rounded-lg border border-amber-200 bg-amber-50 p-3 animate-out fade-out duration-200">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold capitalize text-amber-900">{m.matchedType} report · {m.category}</span>
                      <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-amber-200 text-amber-900">
                        {Math.round(m.score * 100)}% match
                      </span>
                    </div>
                    <MatchBreakdown match={m} />
                    {isMatchBlocked(m) ? (
                      <div className="mt-2 flex h-8 w-full items-center justify-center rounded-lg bg-gray-200 text-xs font-semibold text-gray-600">
                        {sensitiveMatchLabel(m)}
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOverlayOpen(false);
                            onViewMatch?.(m.matchedReportId);
                          }}
                          className="h-8 flex-1 rounded-lg bg-amber-500 text-xs font-semibold text-white transition-colors hover:bg-amber-600 cursor-pointer"
                        >
                          View Item →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleDismissMatch(m.matchedReportId);
                            if (activeMatches.length <= 2) {
                              setOverlayOpen(false);
                            }
                          }}
                          className="h-8 px-3 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✕ Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOverlayOpen(false)}
                className="mt-4 h-9 w-full rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </Modal>
        )}

        <div className="mt-auto flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => onView(report.id)}
            className="h-9 flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            View Details
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(report.id)}
              className="h-9 flex-1 rounded-lg border border-blue-600 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
