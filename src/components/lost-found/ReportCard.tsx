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

/** Marks words in `text` that also appear (case/punctuation-insensitive) in `otherText` — a visual approximation of the token-overlap score, not the exact scoring algorithm. */
function highlightOverlap(text: string, otherText: string): React.ReactNode {
  const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const otherWords = new Set(otherText.split(/\s+/).map(normalize).filter(Boolean));
  return text.split(/(\s+)/).map((part, i) => {
    const norm = normalize(part);
    if (!norm || !otherWords.has(norm)) return <React.Fragment key={i}>{part}</React.Fragment>;
    return (
      <mark key={i} className="rounded bg-amber-300/70 px-0.5 text-amber-950">
        {part}
      </mark>
    );
  });
}

function WholeValueHighlight({ value, matched }: { value: string; matched: boolean }) {
  if (!value) return <>—</>;
  if (!matched) return <>{value}</>;
  return (
    <mark className="rounded bg-amber-300/70 px-0.5 text-amber-950">{value}</mark>
  );
}

function MatchAttributeRow({
  label,
  lostValue,
  foundValue,
  percent,
  mode,
}: {
  label: string;
  lostValue: string;
  foundValue: string;
  percent: number;
  /** "words": highlight the overlapping words between the two values. "whole": highlight each value entirely if percent indicates a full match. */
  mode: "words" | "whole";
}) {
  return (
    <li>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-amber-900">{label}</span>
        <span className="text-amber-700">{percent}%</span>
      </div>
      <p className="text-amber-800">
        Lost: {mode === "words" ? highlightOverlap(lostValue || "—", foundValue || "") : <WholeValueHighlight value={lostValue} matched={percent === 100} />}
      </p>
      <p className="text-amber-800">
        Found: {mode === "words" ? highlightOverlap(foundValue || "—", lostValue || "") : <WholeValueHighlight value={foundValue} matched={percent === 100} />}
      </p>
    </li>
  );
}

function MatchBreakdown({ report, match }: { report: ReportSummary; match: InstantMatch }) {
  const sourceLocation = report.type === "lost" ? report.last_seen_location : report.found_location || report.pickup_location;
  const isReportLost = report.type === "lost";
  const lost = {
    category: isReportLost ? report.category : match.category,
    location: isReportLost ? sourceLocation ?? "" : match.location,
    description: isReportLost ? report.description : match.description,
  };
  const found = {
    category: isReportLost ? match.category : report.category,
    location: isReportLost ? match.location : sourceLocation ?? "",
    description: isReportLost ? match.description : report.description,
  };

  return (
    <ul className="mt-1.5 space-y-2 text-[11px] text-amber-800">
      <MatchAttributeRow
        label="Category"
        lostValue={lost.category}
        foundValue={found.category}
        percent={match.categoryMatch ? 100 : 0}
        mode="whole"
      />
      <MatchAttributeRow
        label="Location"
        lostValue={lost.location}
        foundValue={found.location}
        percent={Math.round(match.locationScore * 100)}
        mode="words"
      />
      <MatchAttributeRow
        label="Description"
        lostValue={lost.description}
        foundValue={found.description}
        percent={Math.round(match.descriptionScore * 100)}
        mode="words"
      />
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
  const location = report.type === "lost" ? report.last_seen_location : report.found_location || report.pickup_location;
  const topMatch = matches?.[0];

  return (
    <article
      className={[
        "card-wobble flex flex-col overflow-hidden rounded-xl border shadow-card transition-shadow hover:shadow-md",
        report.is_sensitive
          ? "border-red-300 bg-red-50"
          : report.type === "lost"
            ? "border-rose-100 bg-rose-50/70"
            : "border-green-100 bg-green-50/70",
      ].join(" ")}
    >
      <div className="relative h-40 w-full bg-gray-100">
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
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-wide text-gray-400">
            {report.is_sensitive ? "Photo restricted" : "No photo"}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {report.type === "lost" ? "Lost" : "Found"}
          </span>
        </div>

        <h3 className="text-sm font-semibold capitalize text-gray-900">{report.category}</h3>
        <p className="mt-1 truncate text-xs text-gray-500">Location: {location}</p>

        <div className="mt-3 flex items-center gap-2">
          <span className={["rounded px-2 py-0.5 text-[11px] font-semibold capitalize", statusTone[report.status] ?? "bg-gray-100 text-gray-500"].join(" ")}>
            {report.status}
          </span>
          {report.is_sensitive && (
            <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-red-100 text-red-600">Sensitive</span>
          )}
          {topMatch && (
            <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800">
              {Math.round(topMatch.score * 100)}% match
            </span>
          )}
        </div>

        {topMatch && matches && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900">
              This {report.type} report may match{" "}
              {matches.length > 1 ? `${matches.length} different ${topMatch.matchedType} reports` : `a ${topMatch.matchedType} report`}
            </p>
            <MatchBreakdown report={report} match={topMatch} />
            {matches.length > 1 ? (
              <button
                type="button"
                onClick={() => setOverlayOpen(true)}
                className="mt-2 h-8 w-full rounded-lg bg-amber-500 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
              >
                View all {matches.length} {topMatch.matchedType} matches
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onViewMatch?.(topMatch.matchedReportId)}
                className="mt-2 h-8 w-full rounded-lg bg-amber-500 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
              >
                View the matching {topMatch.matchedType} item →
              </button>
            )}
          </div>
        )}

        {matches && matches.length > 1 && topMatch && (
          <Modal open={overlayOpen} onClose={() => setOverlayOpen(false)} labelledBy="matches-overlay-title">
            <div className="max-h-[80vh] overflow-y-auto p-5">
              <h2 id="matches-overlay-title" className="mb-1 text-base font-bold text-gray-900 capitalize">
                {topMatch.matchedType} reports matching your {report.category} ({report.type} report)
              </h2>
              <p className="mb-3 text-xs text-gray-500">
                Every item below is a <span className="font-semibold capitalize">{topMatch.matchedType}</span> report — pick the one that&apos;s actually yours.
              </p>
              <div className="space-y-3">
                {matches.map((m) => (
                  <div key={m.matchedReportId} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold capitalize text-amber-900">{m.matchedType} report · {m.category}</span>
                      <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-amber-200 text-amber-900">
                        {Math.round(m.score * 100)}% match
                      </span>
                    </div>
                    <MatchBreakdown report={report} match={m} />
                    <button
                      type="button"
                      onClick={() => {
                        setOverlayOpen(false);
                        onViewMatch?.(m.matchedReportId);
                      }}
                      className="mt-2 h-8 w-full rounded-lg bg-amber-500 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                    >
                      View this {m.matchedType} item →
                    </button>
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
            className="h-9 flex-1 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            View Details
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(report.id)}
              className="h-9 flex-1 rounded-lg border border-brand text-sm font-medium text-brand transition-colors hover:bg-brand-light"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
