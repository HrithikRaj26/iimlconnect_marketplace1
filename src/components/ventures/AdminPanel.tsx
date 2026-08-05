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
}

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

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

  const handleStatusUpdate = async (id: string, nextStatus: "approved" | "rejected") => {
    if (!confirm(`Are you sure you want to ${nextStatus === "approved" ? "Approve" : "Reject"} this venture?`)) return;
    
    setSubmittingId(id);
    try {
      await ventureService.updateVentureStatus(id, nextStatus);
      // Reload stats
      await loadStats();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total broadcasts</p>
          <p className="text-2xl font-black text-gray-900">{stats.totals.totalPosts}</p>
        </div>
      </div>

      {/* Analytics Distributions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Registration Growth Trends</h3>
          <div className="flex flex-col justify-end h-40 pt-4 space-y-2">
            {stats.registrationsOverTime.length === 0 ? (
              <p className="text-gray-400 italic text-center w-full">No registrations logged over time.</p>
            ) : (
              <div className="flex items-end justify-between h-full w-full px-2">
                {stats.registrationsOverTime.map((r, idx) => {
                  const maxCount = Math.max(...stats.registrationsOverTime.map(item => item.count), 1);
                  const barHeight = (r.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 group">
                      <span className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.count}
                      </span>
                      <div
                        className="w-8 rounded-t bg-orange-400 hover:bg-orange-500 transition-all shrink-0 cursor-pointer"
                        style={{ height: `${Math.max(10, barHeight * 0.8)}px` }}
                      />
                      <span className="text-[10px] font-extrabold text-gray-400 truncate max-w-[60px]">{r.date}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Moderation Approval Queue */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-gray-900">🛡️ Approval Queue</h3>
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
                    <p className="text-xs font-semibold text-orange-600">{v.category}</p>
                    <p className="text-xs font-medium text-gray-500 italic mt-0.5">"{v.tagline}"</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-2">
                      Submitter: {v.owner_name} ({v.owner_batch})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
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
    </div>
  );
}
