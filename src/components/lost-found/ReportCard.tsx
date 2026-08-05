"use client";

import Image from "next/image";
import React from "react";
import { InstantMatch, ReportSummary } from "@/types/lostFound";

const statusTone: Record<string, string> = {
  open: "bg-brand-light text-brand-dark",
  available: "bg-brand-light text-brand-dark",
  matched: "bg-amber-100 text-amber-700",
  resolved: "bg-success-light text-success",
  archived: "bg-gray-100 text-gray-500",
};

export function ReportCard({
  report,
  onView,
  onEdit,
  match,
  onViewMatch,
}: {
  report: ReportSummary;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  match?: InstantMatch;
  onViewMatch?: (id: string) => void;
}) {
  const location = report.type === "lost" ? report.last_seen_location : report.found_location || report.pickup_location;

  return (
    <article
      className={[
        "flex flex-col overflow-hidden rounded-xl border shadow-card transition-shadow hover:shadow-md",
        report.is_sensitive ? "border-red-300 bg-red-50" : "border-gray-200 bg-white",
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
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {report.is_sensitive ? "🔒" : "📷"}
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
        <p className="mt-1 truncate text-xs text-gray-500">📍 {location}</p>

        <div className="mt-3 flex items-center gap-2">
          <span className={["rounded px-2 py-0.5 text-[11px] font-semibold capitalize", statusTone[report.status] ?? "bg-gray-100 text-gray-500"].join(" ")}>
            {report.status}
          </span>
          {report.is_sensitive && (
            <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-red-100 text-red-600">Sensitive</span>
          )}
          {match && (
            <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800">
              {Math.round(match.score * 100)}% match
            </span>
          )}
        </div>

        {match && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900">
              Possible match with a {match.matchedType} report
            </p>
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-amber-800">
              <li>{match.categoryMatch ? "✓" : "✗"} Category {match.categoryMatch ? "matches" : "differs"} ({match.category})</li>
              <li>{match.locationScore > 0 ? "✓" : "✗"} Location similarity: {Math.round(match.locationScore * 100)}% ({match.location})</li>
              <li>{match.descriptionScore > 0 ? "✓" : "✗"} Description similarity: {Math.round(match.descriptionScore * 100)}%</li>
            </ul>
            <button
              type="button"
              onClick={() => onViewMatch?.(match.matchedReportId)}
              className="mt-2 h-8 w-full rounded-lg bg-amber-500 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
            >
              View matching {match.matchedType} item
            </button>
          </div>
        )}

        <div className="mt-3 flex gap-2">
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
