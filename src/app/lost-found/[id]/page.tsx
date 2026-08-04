"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useLostFoundAuth } from "@/hooks/useLostFoundAuth";
import { lostFoundService, resolveLostFoundPhotoUrl, ApiError } from "@/services/lostFoundService";
import { Contact } from "@/types/lostFound";

interface Detail {
  id: string;
  type: "lost" | "found";
  category: string;
  description: string;
  status: string;
  sensitivity_tier: 1 | 2 | 3;
  photo_url: string | null;
  reporter_id?: string;
  finder_id?: string;
  last_seen_location?: string;
  pickup_location?: string;
  contents_withheld?: boolean;
  finderContact?: Contact;
  matchedFinderContact?: Contact;
}

/** "Report Detail" (Section 2.3). */
export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, role } = useLostFoundAuth();
  const [report, setReport] = useState<Detail | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemLabel, setItemLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await lostFoundService.getById(params.id)) as unknown as Detail;
      setReport(data);
      setPhoto(await resolveLostFoundPhotoUrl(data.photo_url));
    } catch (e: any) {
      setError(e.message ?? "Could not load report");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="p-10 text-center text-sm text-gray-500">Loading…</div>;
  if (error || !report) return <div className="p-10 text-center text-sm font-medium text-red-500">{error ?? "Report not found"}</div>;

  const isOwner = userId === report.reporter_id;
  const isCustodian = role === "custodian" || role === "admin";
  const contact = report.finderContact ?? report.matchedFinderContact;

  const checkin = async () => {
    if (!itemLabel) return;
    setBusy(true);
    try {
      await lostFoundService.checkin(report.id, { itemLabel });
      setItemLabel("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const override = async (decision: "confirm" | "reject") => {
    setBusy(true);
    try {
      await lostFoundService.override(report.id, decision);
      await load();
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : "Override failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
          {photo && (
            <div className="relative h-64 w-full bg-gray-100">
              <Image src={photo} alt={report.category} fill className="object-cover" unoptimized />
            </div>
          )}
          <div className="space-y-3 p-6">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              {report.type === "lost" ? "Lost item" : "Found item"}
            </p>
            <h1 className="text-2xl font-bold capitalize text-gray-900">{report.category}</h1>
            <div className="flex gap-2">
              <span className="rounded px-2 py-0.5 text-[11px] font-semibold capitalize bg-brand-light text-brand-dark">
                {report.status}
              </span>
              <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-red-100 text-red-600">
                Tier {report.sensitivity_tier}
              </span>
            </div>

            <p className="text-sm text-gray-700">{report.description}</p>
            <p className="text-sm text-gray-500">
              📍 {report.type === "lost" ? report.last_seen_location : report.pickup_location}
            </p>
            {report.type === "found" && report.contents_withheld && (
              <p className="text-sm text-gray-500">Contents withheld from public view</p>
            )}

            {contact && (
              <div className="rounded-lg bg-success-light p-4">
                <p className="mb-1 text-sm font-bold text-gray-900">Finder contact (revealed after confirmed match)</p>
                {contact.name && <p className="text-sm text-gray-700">{contact.name}</p>}
                {contact.phone && <p className="text-sm text-gray-700">{contact.phone}</p>}
                {contact.email && <p className="text-sm text-gray-700">{contact.email}</p>}
              </div>
            )}

            {report.type === "lost" && isOwner && report.status !== "resolved" && (
              <Button fullWidth onClick={() => router.push(`/lost-found/resolve/${report.id}`)}>
                Mark resolved
              </Button>
            )}

            {report.type === "found" && isCustodian && report.status === "matched" && (
              <Button fullWidth onClick={() => router.push(`/lost-found/handover/${report.id}?tier=${report.sensitivity_tier}`)}>
                Process handover
              </Button>
            )}

            {report.type === "found" && isCustodian && (
              <div className="border-t border-gray-100 pt-4">
                <TextInput
                  label="Desk check-in — item label"
                  value={itemLabel}
                  onChange={(e) => setItemLabel(e.target.value)}
                  placeholder="Shelf 3, bin 12"
                />
                <Button className="mt-2" loading={busy} disabled={!itemLabel} onClick={checkin}>
                  Log check-in
                </Button>
              </div>
            )}

            {role === "admin" && (
              <div className="border-t border-gray-100 pt-4">
                <p className="mb-1 text-sm font-bold text-gray-900">Admin override / dispute resolution</p>
                <p className="mb-2 text-xs text-gray-500">Applies to the most recent match candidate for this report.</p>
                <div className="flex gap-2">
                  <Button loading={busy} onClick={() => override("confirm")}>
                    Force confirm
                  </Button>
                  <Button variant="secondary" loading={busy} onClick={() => override("reject")}>
                    Force reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
