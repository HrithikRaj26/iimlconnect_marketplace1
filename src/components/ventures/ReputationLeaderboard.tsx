"use client";

import React, { useEffect, useState } from "react";
import { ventureService } from "@/services/ventureService";
import { Venture, UserBadge } from "@/types";
import { supabase } from "@/lib/supabase";

interface Contributor {
  name: string;
  batch: string;
  reviewsCount: number;
  badgeCount: number;
  score: number;
}

export default function ReputationLeaderboard() {
  const [topVentures, setTopVentures] = useState<Venture[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [myBadges, setMyBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedBadges, setFlippedBadges] = useState<Record<string, boolean>>({});
  const [shakingBadges, setShakingBadges] = useState<Record<string, boolean>>({});

  // Badge stats for progression
  const [reviewsWritten, setReviewsWritten] = useState(0);
  const [likesGiven, setLikesGiven] = useState(0);

  const loadReputationData = async () => {
    setLoading(true);
    try {
      const { topVentures, topContributors } = await ventureService.getLeaderboards();
      setTopVentures(topVentures);
      setTopContributors(topContributors);

      const badges = await ventureService.getUserBadges();
      setMyBadges(badges);

      // Query database to check user's counts for progress indicators
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        const userId = sessionData.session.user.id;
        const [{ count: revCount }, { count: likeCount }] = await Promise.all([
          supabase.from("reviews").select("*", { count: "exact", head: true }).eq("reviewer_id", userId),
          supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("user_id", userId)
        ]);
        setReviewsWritten(revCount || 0);
        setLikesGiven(likeCount || 0);
      }
    } catch (e) {
      console.error("Error loading reputation board:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReputationData();
  }, []);

  const badgeDefinitions = [
    {
      type: "top_reviewer",
      name: "Top Reviewer",
      icon: "✍️",
      description: "Granted upon writing 3 or more high-quality reviews.",
      check: reviewsWritten >= 3,
      current: reviewsWritten,
      target: 3,
      metric: "reviews"
    },
    {
      type: "active_supporter",
      name: "Active Supporter",
      icon: "🤝",
      description: "Granted for writing 1 review and liking 3 feed posts.",
      check: reviewsWritten >= 1 && likesGiven >= 3,
      progressText: `Reviews: ${reviewsWritten}/1, Likes: ${likesGiven}/3`,
      isMultiMetric: true
    },
    {
      type: "serial_entrepreneur",
      name: "Serial Entrepreneur",
      icon: "💼",
      description: "Granted upon publishing 2 or more approved ventures.",
      check: myBadges.some(b => b.badge_type === "serial_entrepreneur"),
      isActionBased: true
    }
  ];

  return (
    <div className="space-y-8">
      {/* Reputation/Badge shelf */}
      <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">🏆 Campus Trust Shelf</h2>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
            Earn badges to build student trust, unlock founder capabilities, and rise on the contributor list.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-805 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <style>{`
              .perspective-1000 {
                perspective: 1000px;
              }
              .preserve-3d {
                transform-style: preserve-3d;
              }
              .backface-hidden {
                backface-visibility: hidden;
              }
              .rotate-y-180 {
                transform: rotateY(180deg);
              }
              @keyframes lock-shake {
                0%, 100% { transform: translateX(0); }
                15%, 45%, 75% { transform: translateX(-4px) rotate(-1.5deg); }
                30%, 60%, 90% { transform: translateX(4px) rotate(1.5deg); }
              }
              .animate-lock-shake {
                animation: lock-shake 0.4s ease-in-out;
              }
            `}</style>
            {badgeDefinitions.map((badge) => {
              const unlocked = badge.check;
              const isFlipped = !!flippedBadges[badge.type];
              const isShaking = !!shakingBadges[badge.type];
                return (
                <div
                  key={badge.type}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-colors shadow-2xs ${
                    unlocked 
                      ? "bg-white dark:bg-gray-900 border-blue-200/80 dark:border-blue-900/50" 
                      : "bg-gray-50/70 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-90"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">{badge.icon}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                          unlocked 
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50" 
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{badge.name}</h4>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{badge.description}</p>
                    </div>
                  </div>

                  {unlocked ? (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Milestone Achieved</span>
                      <span>✓</span>
                    </div>
                  ) : (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        <span>Progress</span>
                        <span>
                          {badge.isMultiMetric ? badge.progressText : badge.isActionBased ? "Action needed" : `${badge.current}/${badge.target} ${badge.metric}`}
                        </span>
                      </div>
                      {!badge.isMultiMetric && !badge.isActionBased && (
                        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, (badge.current! / badge.target!) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Ventures */}
        <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">⭐ Most Recommended Campus Ventures</h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Student ventures with the highest peer recommendations.</p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-805 rounded-md" />
              ))}
            </div>
          ) : topVentures.length === 0 ? (
            <p className="text-xs font-bold text-gray-400 italic text-center py-6">No approved ventures yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 pr-2">Rank</th>
                    <th className="pb-3 px-2">Venture Name</th>
                    <th className="pb-3 px-2">Category</th>
                    <th className="pb-3 pl-2 text-right">Rating Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-300">
                  {topVentures.map((venture, index) => (
                    <tr key={venture.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 pr-2 font-extrabold text-gray-500 text-xs">
                        {index === 0 ? "🥇 1" : index === 1 ? "🥈 2" : index === 2 ? "🥉 3" : `#${index + 1}`}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={venture.logo_url || ""}
                            className="h-7 w-7 rounded object-cover border bg-gray-50 shrink-0"
                          />
                          <span className="font-extrabold text-gray-900 truncate max-w-[150px]">{venture.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="rounded bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {venture.category}
                        </span>
                      </td>
                      <td className="py-3 pl-2 text-right font-extrabold text-blue-600 dark:text-blue-450">
                        ★ {venture.average_rating} <span className="text-[10px] text-gray-400 font-semibold">({venture.reviews_count})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Reviewers/Contributors */}
        <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">👥 Most Active Supporters & Reviewers</h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Top peer contributors supporting campus startups with feedback.</p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-805 rounded-md" />
              ))}
            </div>
          ) : topContributors.length === 0 ? (
            <p className="text-xs font-bold text-gray-400 italic text-center py-6">No contributors recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 pr-2">Rank</th>
                    <th className="pb-3 px-2">Contributor</th>
                    <th className="pb-3 px-2">Role/Batch</th>
                    <th className="pb-3 pl-2 text-right">Reputation Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-300">
                  {topContributors.map((c, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 pr-2 font-extrabold text-gray-500 text-xs">
                        {index === 0 ? "🥇 1" : index === 1 ? "🥈 2" : index === 2 ? "🥉 3" : `#${index + 1}`}
                      </td>
                      <td className="py-3 px-2 font-extrabold text-gray-900">{c.name}</td>
                      <td className="py-3 px-2 text-xs text-gray-400 font-semibold">{c.batch}</td>
                      <td className="py-3 pl-2 text-right font-extrabold text-blue-600">
                        {c.score} <span className="text-[10px] text-gray-400 font-semibold">({c.reviewsCount} rev)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
