"use client";

import React, { useEffect, useState } from "react";
import { ventureService } from "@/services/ventureService";
import { Venture } from "@/types";
import { Button } from "@/components/ui/Button";

interface Stats {
  totals: { registrations: number; activeUsers: number; totalReviews: number; totalPosts: number };
  registrationsOverTime: { date: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  pendingQueue: Venture[];
  allVentures: Venture[];
}

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selectedVenture, setSelectedVenture] = useState<Venture | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    ventureId: string;
    action: "approved" | "rejected";
    title: string;
    message: string;
  } | null>(null);
  const [notifyDialog, setNotifyDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    emailSentTo?: string;
  } | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await ventureService.getAdminStats();
      setStats(data);
    } catch (e) {
      console.error("Error loading admin stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleStatusUpdate = (id: string, nextStatus: "approved" | "rejected") => {
    const target = stats?.pendingQueue.find(v => v.id === id);
    const vName = target?.name || "Venture";
    setConfirmDialog({
      isOpen: true,
      ventureId: id,
      action: nextStatus,
      title: nextStatus === "approved" ? "Approve Request" : "Reject Request",
      message: `Are you sure you want to ${nextStatus === "approved" ? "approve and authorize" : "reject"} "${vName}"? This action takes effect immediately.`,
    });
  };

  const executeStatusUpdate = async (id: string, nextStatus: "approved" | "rejected") => {
    setSubmittingId(id);
    try {
      const approvedVenture = stats?.pendingQueue.find(v => v.id === id);
      const name = approvedVenture?.name || "Venture";
      const isUpdate = !!approvedVenture?.pending_updates;
      
      const result = await ventureService.updateVentureStatus(id, nextStatus);
      
      if (nextStatus === "approved") {
        const emailAddress = approvedVenture?.contact_links?.email || `${approvedVenture?.owner_name.toLowerCase().replace(/\s+/g, '')}@iiml.ac.in`;
        
        if (result.emailSent) {
          setNotifyDialog({
            isOpen: true,
            title: "Venture Moderated! ✨",
            message: isUpdate 
              ? `The updates for "${name}" have been approved and applied live. A confirmation email has been dispatched.`
              : `"${name}" has been successfully approved and added to the campus catalog. A congratulatory email has been dispatched.`,
            emailSentTo: emailAddress,
          });
        } else {
          setNotifyDialog({
            isOpen: true,
            title: "Venture Approved (Email Failed) ⚠️",
            message: `"${name}" has been approved in the database, but the email notification failed to send: "${result.emailError || "Unknown Resend error"}"`,
            emailSentTo: `${emailAddress} (Failed: ${result.emailError})`,
          });
        }
      } else {
        setNotifyDialog({
          isOpen: true,
          title: "Venture Request Rejected",
          message: `The request for "${name}" has been rejected.`,
        });
      }
      
      // Reload stats
      await loadStats();
    } catch (err) {
      console.error(err);
      setNotifyDialog({
        isOpen: true,
        title: "Moderation Failed",
        message: "Failed to update moderation status. Please verify your connection.",
      });
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Ventures</p>
          <p className="text-2xl font-black text-gray-900">{stats.totals.registrations}</p>
        </div>
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Active Founders</p>
          <p className="text-2xl font-black text-gray-900">{stats.totals.activeUsers}</p>
        </div>
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Reviews</p>
          <p className="text-2xl font-black text-gray-900">{stats.totals.totalReviews}</p>
        </div>
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Broadcasts</p>
          <p className="text-2xl font-black text-gray-900">{stats.totals.totalPosts}</p>
        </div>

        {/* Interactive Moderation Stats Card */}
        <button
          onClick={() => {
            const el = document.getElementById("approval-queue");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className="bg-white rounded-2xl border p-5 shadow-sm space-y-1 hover:border-orange-500/40 hover:shadow-md transition-all text-left group"
        >
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider group-hover:text-orange-600 transition-colors">Approval Pending 🛡️</p>
          <p className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>{stats.pendingQueue.length}</span>
            {stats.pendingQueue.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse inline-block" />
            )}
          </p>
        </button>
      </div>

      {/* Analytics Distributions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Venture Category Mix</h3>
          <div className="space-y-3 font-semibold text-xs text-gray-700">
            {stats.categoryDistribution.length === 0 ? (
              <p className="text-gray-400 italic">No distribution recorded yet.</p>
            ) : (
              stats.categoryDistribution.map((c) => {
                const totalApp = stats.categoryDistribution.reduce((sum, item) => sum + item.count, 0);
                const percent = totalApp > 0 ? (c.count / totalApp) * 100 : 0;
                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-extrabold">{c.category}</span>
                      <span className="text-gray-400">{c.count} ({Math.round(percent)}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Growth trends */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Registration Growth Trends</h3>
          {stats.registrationsOverTime.length === 0 ? (
            <p className="text-xs font-semibold text-gray-450 italic py-8 text-center">No trend data available.</p>
          ) : (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {stats.registrationsOverTime.map((r, idx) => {
                return (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 font-semibold text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500">📈</span>
                      <span>{r.count} registrations</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-gray-400 truncate max-w-[60px]">{r.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Moderation Approval Queue */}
      <div id="approval-queue" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">🛡️ Approval Queue</h3>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Startups waiting for platform moderation review.</p>
        </div>

        {stats.pendingQueue.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs font-bold text-gray-400 italic">Queue is clear! No pending ventures need moderation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.pendingQueue.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-gray-150 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/20"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={v.logo_url || ""}
                    className="h-12 w-12 rounded object-cover border bg-gray-50 shrink-0 mt-0.5"
                  />
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">{v.name}</h4>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span className="text-xs font-semibold text-orange-600">{v.category}</span>
                      {v.pending_updates ? (
                        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-black text-orange-800 border border-orange-200">
                          ⚠️ Profile Update Request
                        </span>
                      ) : (
                        <span className="rounded bg-green-50 px-1.5 py-0.5 text-[9px] font-extrabold text-green-700 border border-green-200">
                          New Venture Request
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-500 italic mt-1">"{v.tagline}"</p>
                    
                    {v.pending_updates && (
                      <div className="mt-3 text-[11px] bg-orange-50/70 border border-orange-100 rounded-xl p-3 text-gray-700 font-semibold space-y-1 max-w-md">
                        <span className="text-[10px] font-black text-orange-700 tracking-wider uppercase block mb-1">Proposed Updates (Pending Admin Approval):</span>
                        {v.pending_updates.name !== v.name && (
                          <div>• Name: <span className="line-through text-gray-400">{v.name}</span> → <span className="text-orange-700 font-bold">{v.pending_updates.name}</span></div>
                        )}
                        {v.pending_updates.tagline !== v.tagline && (
                          <div>• Tagline: <span className="line-through text-gray-400">{v.tagline}</span> → <span className="text-orange-700 font-bold">{v.pending_updates.tagline}</span></div>
                        )}
                        {v.pending_updates.description !== v.description && (
                          <div className="line-clamp-2">• Description: <span className="text-orange-750 font-bold">{v.pending_updates.description}</span></div>
                        )}
                        {v.pending_updates.category !== v.category && (
                          <div>• Category: <span className="line-through text-gray-400">{v.category}</span> → <span className="text-orange-700 font-bold">{v.pending_updates.category}</span></div>
                        )}
                        {v.pending_updates.offerings.join(",") !== v.offerings.join(",") && (
                          <div>• Offerings: <span className="text-orange-700 font-bold">{v.pending_updates.offerings.join(", ")}</span></div>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] font-bold text-gray-400 mt-2">
                      Submitter: {v.owner_name} ({v.owner_batch})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedVenture(v)}
                    className="border-gray-200 hover:bg-gray-50 text-gray-700 font-extrabold text-xs"
                  >
                    Review Details 🔍
                  </Button>
                  <Button
                    loading={submittingId === v.id}
                    onClick={() => handleStatusUpdate(v.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    loading={submittingId === v.id}
                    onClick={() => handleStatusUpdate(v.id, "rejected")}
                    className="border-red-100 hover:bg-red-50 text-red-600 hover:text-red-700 font-extrabold"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Directory & SLA Moderation */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">🏢 Active Ventures & SLA Moderation</h3>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Directory list of approved campus startups. Suspend/reactivate listings manually.</p>
        </div>

        {stats.allVentures.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs font-bold text-gray-400 italic">No approved or active ventures listed yet.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {stats.allVentures.map((v) => (
              <div key={v.id} className="rounded-xl border border-gray-150 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/20">
                <div className="flex items-center gap-3">
                  <img src={v.logo_url || ""} className="h-10 w-10 rounded-lg object-cover border bg-white shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-gray-900">{v.name}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold border ${
                        v.status === "suspended" 
                          ? "bg-red-50 text-red-700 border-red-200" 
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}>
                        {v.status === "suspended" ? "Suspended ⚠️" : "Active 🟢"}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-400 mt-1">Founder: {v.owner_name} | Platform Due: ₹{v.current_due}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {v.status === "suspended" ? (
                    <Button
                      loading={submittingId === v.id}
                      onClick={async () => {
                        setSubmittingId(v.id);
                        try {
                          const result = await ventureService.reactivateVenture(v.id);
                          if (result.emailSent) {
                            alert(`Success! "${v.name}" has been reactivated. Email sent to owner.`);
                          } else {
                            alert(`Success! "${v.name}" has been reactivated. Email failed: ${result.emailError}`);
                          }
                          await loadStats();
                        } catch (err: any) {
                          alert("Failed to reactivate: " + err.message);
                        } finally {
                          setSubmittingId(null);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg"
                    >
                      Reactivate 🟢
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      loading={submittingId === v.id}
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to suspend "${v.name}"?`)) return;
                        setSubmittingId(v.id);
                        try {
                          const result = await ventureService.suspendVenture(v.id);
                          if (result.emailSent) {
                            alert(`Success! "${v.name}" has been suspended. Warning email sent.`);
                          } else {
                            alert(`Success! "${v.name}" has been suspended. Email failed: ${result.emailError}`);
                          }
                          await loadStats();
                        } catch (err: any) {
                          alert("Failed to suspend: " + err.message);
                        } finally {
                          setSubmittingId(null);
                        }
                      }}
                      className="border-red-150 hover:bg-red-50 text-red-600 hover:text-red-700 font-extrabold text-[10px] py-1.5 px-3 rounded-lg"
                    >
                      Suspend ⚠️
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moderation Review Details Modal */}
      {selectedVenture && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Moderation Request Details</h3>
                  <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                    {selectedVenture.pending_updates ? "Profile Update Request" : "New Venture Registration"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVenture(null)}
                className="text-gray-400 hover:text-gray-655 hover:bg-gray-100 rounded-lg p-1 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 text-xs text-gray-650 font-semibold leading-relaxed">
              {/* Branding Block */}
              <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <img
                  src={selectedVenture.logo_url || ""}
                  className="h-14 w-14 rounded-xl object-cover border bg-white shrink-0"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900">{selectedVenture.name}</h4>
                  <p className="text-[10px] font-bold text-orange-600 mt-0.5">{selectedVenture.category}</p>
                  <p className="text-[11px] font-medium text-gray-500 italic mt-1">"{selectedVenture.tagline}"</p>
                </div>
              </div>

              {/* Submitter Details */}
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Founder Submitter</span>
                  <p className="text-gray-900 font-extrabold">{selectedVenture.owner_name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Batch / Class</span>
                  <p className="text-gray-900 font-extrabold">{selectedVenture.owner_batch}</p>
                </div>
              </div>

              {/* Stacked comparison details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Live / Original Details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b pb-1.5">
                    {selectedVenture.pending_updates ? "Current Live Details" : "Venture Description"}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 block mb-0.5">Pitch Description:</span>
                      <p className="bg-gray-50/55 p-3 rounded-xl border border-gray-100 text-gray-600 whitespace-pre-wrap">{selectedVenture.description}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 block mb-1">Venture Offerings:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedVenture.offerings.map((o, idx) => (
                          <span key={idx} className="bg-white border rounded px-2 py-0.5 text-[10px]">{o}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 block mb-0.5">Contact Channels:</span>
                      <p>Email: <span className="text-gray-800 font-bold">{selectedVenture.contact_links?.email || "None"}</span></p>
                      <p className="mt-1">WhatsApp: <span className="text-gray-800 font-bold">{selectedVenture.contact_links?.whatsapp || "None"}</span></p>
                      {selectedVenture.contact_links?.website && (
                        <p className="mt-1">Website: <a href={selectedVenture.contact_links.website} target="_blank" rel="noreferrer" className="text-orange-600 underline font-bold">{selectedVenture.contact_links.website}</a></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Proposed Updates (Only if they exist) */}
                {selectedVenture.pending_updates && (
                  <div className="space-y-4 bg-orange-50/30 p-4 rounded-2xl border border-orange-100/70">
                    <h4 className="text-[10px] font-black text-orange-850 uppercase tracking-wider border-b border-orange-100/50 pb-1.5">
                      Proposed Changes
                    </h4>
                    <div className="space-y-3">
                      {selectedVenture.pending_updates.name !== selectedVenture.name && (
                        <div>
                          <span className="text-[9px] font-bold text-orange-600 block mb-0.5">Brand Name:</span>
                          <p className="text-orange-900 font-extrabold">{selectedVenture.pending_updates.name}</p>
                        </div>
                      )}
                      {selectedVenture.pending_updates.tagline !== selectedVenture.tagline && (
                        <div>
                          <span className="text-[9px] font-bold text-orange-600 block mb-0.5">Tagline:</span>
                          <p className="text-orange-900 font-bold">"{selectedVenture.pending_updates.tagline}"</p>
                        </div>
                      )}
                      {selectedVenture.pending_updates.description !== selectedVenture.description && (
                        <div>
                          <span className="text-[9px] font-bold text-orange-600 block mb-0.5">Description:</span>
                          <p className="bg-white p-3 rounded-xl border text-orange-950 font-medium whitespace-pre-wrap">{selectedVenture.pending_updates.description}</p>
                        </div>
                      )}
                      {selectedVenture.pending_updates.offerings.join(",") !== selectedVenture.offerings.join(",") && (
                        <div>
                          <span className="text-[9px] font-bold text-orange-600 block mb-1">Offerings:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedVenture.pending_updates.offerings.map((o, idx) => (
                              <span key={idx} className="bg-white border border-orange-200 text-orange-855 rounded px-2 py-0.5 text-[10px]">{o}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(selectedVenture.pending_updates.contact_links?.email !== selectedVenture.contact_links?.email ||
                        selectedVenture.pending_updates.contact_links?.whatsapp !== selectedVenture.contact_links?.whatsapp ||
                        selectedVenture.pending_updates.contact_links?.website !== selectedVenture.contact_links?.website) && (
                        <div>
                          <span className="text-[9px] font-bold text-orange-600 block mb-0.5">Updated Channels:</span>
                          <p>Email: <span className="text-orange-950 font-bold">{selectedVenture.pending_updates.contact_links?.email || "None"}</span></p>
                          <p className="mt-1">WhatsApp: <span className="text-orange-950 font-bold">{selectedVenture.pending_updates.contact_links?.whatsapp || "None"}</span></p>
                          {selectedVenture.pending_updates.contact_links?.website && (
                            <p className="mt-1">Website: <span className="text-orange-950 font-bold">{selectedVenture.pending_updates.contact_links.website}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedVenture(null)}
                className="rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-700 px-4 py-2.5 text-xs font-black transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <Button
                  loading={submittingId === selectedVenture.id}
                  onClick={async () => {
                    const vid = selectedVenture.id;
                    await handleStatusUpdate(vid, "approved");
                    setSelectedVenture(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Approve Request
                </Button>
                <Button
                  variant="secondary"
                  loading={submittingId === selectedVenture.id}
                  onClick={async () => {
                    const vid = selectedVenture.id;
                    await handleStatusUpdate(vid, "rejected");
                    setSelectedVenture(null);
                  }}
                  className="border-red-100 hover:bg-red-50 text-red-600 hover:text-red-700 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-colors"
                >
                  Reject Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border shadow-xs ${
              confirmDialog.action === "approved" 
                ? "bg-green-50 text-green-500 border-green-150 animate-bounce" 
                : "bg-red-50 text-red-500 border-red-150"
            }`}>
              {confirmDialog.action === "approved" ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-lg font-black font-mono">⚠️</span>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">{confirmDialog.title}</h3>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">{confirmDialog.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="w-full rounded-xl border border-gray-250 hover:bg-gray-50 px-4 py-2.5 text-xs font-black text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { ventureId, action } = confirmDialog;
                  setConfirmDialog(null);
                  await executeStatusUpdate(ventureId, action);
                }}
                className={`w-full rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-md transition-colors ${
                  confirmDialog.action === "approved" 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmDialog.action === "approved" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Success Notification Dialog */}
      {notifyDialog && notifyDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-500 border border-green-150 shadow-xs">
              <span className="text-xl">✨</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">{notifyDialog.title}</h3>
              <p className="text-xs font-medium text-gray-500 leading-relaxed pt-1">{notifyDialog.message}</p>
              {notifyDialog.emailSentTo && (
                <div className="text-[10px] font-bold text-gray-450 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mt-2 text-left space-y-1">
                  <span className="text-gray-400 block font-black uppercase tracking-wider text-[8px]">Notification Dispatch</span>
                  <span className="truncate block font-semibold text-gray-600">Email: {notifyDialog.emailSentTo}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setNotifyDialog(null)}
              className="w-full rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-black text-white hover:bg-orange-700 shadow-md transition-colors"
            >
              Done 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
