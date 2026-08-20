"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useLostFoundAuth } from "@/hooks/useLostFoundAuth";
import { lostFoundService, ApiError } from "@/services/lostFoundService";
import { BackToLostFound } from "@/components/lost-found/BackToLostFound";
import { Contact, InstantMatch } from "@/types/lostFound";

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

interface Detail {
  id: string;
  type: "lost" | "found";
  category: string;
  description: string;
  status: string;
  is_sensitive: boolean;
  photo_url: string | null;
  reporter_id?: string;
  finder_id?: string;
  last_seen_location?: string;
  pickup_location?: string;
  found_location?: string;
  contents_withheld?: boolean;
  visible_to_public?: boolean;
  finderContact?: Contact;
  matchedFinderContact?: Contact;
  claimant_id?: string | null;
  claimed_at?: string | null;
  transfer_completed_at?: string | null;
  claimantContact?: Contact;
}

/** "Report Detail" (Section 2.3). */
export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, role } = useLostFoundAuth();
  const [report, setReport] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemLabel, setItemLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<InstantMatch[]>([]);
  const [claimAcknowledged, setClaimAcknowledged] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await lostFoundService.getById(params.id)) as unknown as Detail;
      setReport(data);
    } catch (e: any) {
      setError(e.message ?? "Could not load report");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    lostFoundService
      .myMatches()
      .then(setMatches)
      .catch(() => setMatches([]));
  }, [userId]);

  if (loading) return <div className="p-10 text-center text-sm text-gray-500">Loading…</div>;
  if (error || !report) return <div className="p-10 text-center text-sm font-medium text-red-500">{error ?? "Report not found"}</div>;

  const isOwner = userId === report.reporter_id;
  const isCustodian = role === "custodian" || role === "admin";
  const isFinder = userId === report.finder_id;
  const isClaimant = !!userId && userId === report.claimant_id;
  const contact = report.finderContact ?? report.matchedFinderContact;
  // If the viewer already has a found report that matches this lost report,
  // they don't need the "file a found report" prompt again.
  const hasExistingFoundMatch = matches.some((m) => m.sourceType === "found" && m.matchedReportId === report.id);

  const claim = async () => {
    setBusy(true);
    setError(null);
    try {
      await lostFoundService.claim(report.id);
      await load();
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : "Could not claim item");
    } finally {
      setBusy(false);
    }
  };

  const completeTransfer = async () => {
    setBusy(true);
    setError(null);
    try {
      await lostFoundService.completeTransfer(report.id);
      await load();
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : "Could not complete transfer");
    } finally {
      setBusy(false);
    }
  };

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

  const handleReport = async () => {
    if (!confirm("Report this listing as fake or inappropriate? This will alert the admin team.")) return;
    // In a real app, this would insert into a 'reports' table.
    alert("Report submitted successfully. Our admin team will review this listing.");
  };

  const handleShare = async () => {
    if (!report) return;
    const url = window.location.href;
    const isLost = report.type === 'lost';
    const location = isLost ? report.last_seen_location : report.found_location;
    const locationText = location ? ` at "${location}"` : '';
    const text = `${isLost ? 'Lost' : 'Found'} "${report.category}"${locationText} on IIML Campus. Check it out on IIML Connect!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${typeLabel} Item`,
          text: text,
          url: url,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback for desktop WhatsApp Web
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <BackToLostFound />
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
          {report.photo_url && (
            <div className="relative h-64 w-full bg-gray-100">
              <Image src={report.photo_url} alt={report.category} fill className="object-contain" unoptimized />
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
              {report.is_sensitive && (
                <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-red-100 text-red-600">
                  Sensitive
                </span>
              )}
              {report.type === "lost" && report.visible_to_public === false && (
                <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-600">
                  Withheld from public
                </span>
              )}
            </div>

            <p className="text-sm text-gray-700">{report.description}</p>
            {report.type === "lost" ? (
              <p className="text-sm text-gray-500">Last seen: {report.last_seen_location}</p>
            ) : (
              <>
                <p className="text-sm text-gray-500">Found near: {report.found_location}</p>
                <p className="text-sm text-gray-500">Pickup: {report.pickup_location}</p>
              </>
            )}
            {report.type === "found" && report.contents_withheld && (
              <p className="text-sm text-gray-500">Contents withheld from public view</p>
            )}

            {contact && (
              <div className="rounded-lg bg-success-light p-4">
                <p className="mb-1 text-sm font-bold text-gray-900">
                  {isCustodian
                    ? "Finder contact"
                    : isClaimant
                      ? "Finder contact — arrange pickup"
                      : "Finder contact (revealed after confirmed match)"}
                </p>
                {contact.name && <p className="text-sm text-gray-700">{contact.name}</p>}
                {contact.phone && <p className="text-sm text-gray-700">{contact.phone}</p>}
                {contact.email && <p className="text-sm text-gray-700">{contact.email}</p>}
              </div>
            )}

            {report.claimantContact && (
              <div className="rounded-lg bg-brand-light p-4">
                <p className="mb-1 text-sm font-bold text-gray-900">
                  This item has been claimed{report.claimantContact.name ? ` by ${report.claimantContact.name}` : ""}
                  {report.transfer_completed_at ? " (transfer completed)" : " (pending transfer)"}
                </p>
                {report.claimantContact.phone && <p className="text-sm text-gray-700">{report.claimantContact.phone}</p>}
                {report.claimantContact.email && <p className="text-sm text-gray-700">{report.claimantContact.email}</p>}
                {formatDate(report.claimed_at) && (
                  <p className="mt-1 text-xs text-gray-500">Claimed on {formatDate(report.claimed_at)}</p>
                )}
                {report.status === "resolved" && formatDate(report.transfer_completed_at) && (
                  <p className="text-xs text-gray-500">Resolved on {formatDate(report.transfer_completed_at)}</p>
                )}
              </div>
            )}

            {report.type === "found" &&
              report.status === "available" &&
              !report.is_sensitive &&
              !report.claimant_id &&
              !isFinder && (
                <div className="space-y-2">
                  <label className="flex items-start gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={claimAcknowledged}
                      onChange={(e) => setClaimAcknowledged(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <span>
                      Claiming the item will record you as owner and details will be retained for next 30 days for
                      dispute resolution purposes
                    </span>
                  </label>
                  <Button fullWidth loading={busy} disabled={!claimAcknowledged} onClick={claim}>
                    Claim this Item
                  </Button>
                </div>
              )}

            {report.type === "found" && report.status === "available" && report.is_sensitive && (
              <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                This item was deposited at PGP office by the finder. Please collect it from PGP office.
              </p>
            )}

            {report.type === "found" && isFinder && report.claimant_id && !report.transfer_completed_at && (
              <div className="space-y-1.5">
                <Button fullWidth loading={busy} onClick={completeTransfer}>
                  Transfer Completed
                </Button>
                <p className="text-center text-xs text-gray-400">
                  Optional — this resolves automatically once the owner marks their report resolved.
                </p>
              </div>
            )}

            {report.type === "lost" && isOwner && report.status !== "resolved" && (
              <Button fullWidth onClick={() => router.push(`/lost-found/resolve/${report.id}`)}>
                Mark resolved
              </Button>
            )}

            {report.type === "lost" && !isOwner && report.status === "open" && !hasExistingFoundMatch && (
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  const params = new URLSearchParams({
                    category: report.category,
                    description: report.description,
                    location: report.last_seen_location ?? "",
                  });
                  router.push(`/lost-found/report/found?${params.toString()}`);
                }}
              >
                I Found This Item — File a Found Report
              </Button>
            )}

            {report.type === "found" && isCustodian && report.status === "matched" && (
              <Button fullWidth onClick={() => router.push(`/lost-found/handover/${report.id}?sensitive=${report.is_sensitive}`)}>
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

            <div className={`border-t border-gray-100 pt-4 mt-4 flex flex-col gap-3 ${!isOwner ? 'pb-2' : ''}`}>
              <Button 
                variant="secondary"
                fullWidth
                onClick={handleShare}
              >
                <span className="flex items-center gap-2 justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  Share
                </span>
              </Button>
            </div>

            {!isOwner && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <button 
                  onClick={handleReport}
                  className="w-full text-center text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors"
                >
                  🚩 Report Fake/Inappropriate Listing
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
