"use client";

import Image from "next/image";
import React from "react";
import { ReportSummary } from "@/types/lostFound";

const statusTone: Record<string, string> = {
  open: "bg-brand-light text-brand-dark",
  available: "bg-brand-light text-brand-dark",
  matched: "bg-amber-100 text-amber-700",
  resolved: "bg-success-light text-success",
  archived: "bg-gray-100 text-gray-500",
};

export function ReportCard({ report, onView }: { report: ReportSummary; onView: (id: string) => void }) {
  const location = report.type === "lost" ? report.last_seen_location : report.pickup_location;

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
        </div>

        <button
          type="button"
          onClick={() => onView(report.id)}
          className="mt-3 h-9 w-full rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          View Details
        </button>
      </div>
    </article>
  );
}
