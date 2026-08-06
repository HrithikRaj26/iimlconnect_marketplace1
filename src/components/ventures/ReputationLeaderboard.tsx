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
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">🏆 Campus Reputation Shelf</h2>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
            Earn badges to build student trust, unlock founder capabilities, and rise on the contributor list.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl" />
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
                  onClick={() => {
                    if (unlocked) {
                      setFlippedBadges(prev => ({
                        ...prev,
                        [badge.type]: !prev[badge.type]
                      }));
                    } else {
                      // Trigger lock shake rattle
                      setShakingBadges(prev => ({ ...prev, [badge.type]: true }));
                      setTimeout(() => {
                        setShakingBadges(prev => ({ ...prev, [badge.type]: false }));
                      }, 400);
                    }
                  }}
                  className={`h-48 w-full cursor-pointer perspective-1000 select-none group ${
                    isShaking ? "animate-lock-shake" : ""
                  }`}
                >
                  <div
                    className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
                      isFlipped && unlocked ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* FRONT SIDE (Standard Badge Info) */}
                    <div className={`absolute inset-0 backface-hidden rounded-2xl border p-5 flex flex-col justify-between transition-all bg-white/70 dark:bg-gray-900/75 backdrop-blur-md border-white/80 dark:border-gray-800 shadow-md group-hover:shadow-lg group-hover:border-orange-200/50 ${
                      unlocked ? "opacity-100" : "opacity-80"
                    }`}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl">{badge.icon}</span>
                          <span
                            className={`rounded px-2 py-0.5 text-[9px] font-extrabold border uppercase tracking-wider ${
                              unlocked ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-gray-100 text-gray-500 border-gray-200"
                            }`}
                          >
                            {unlocked ? "Unlocked" : "Locked"}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-gray-900">{badge.name}</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">{badge.description}</p>
                      </div>

                      {/* Progress tracker or Flip hint */}
                      {unlocked ? (
                        <div className="mt-2 text-[9px] font-extrabold text-orange-600 animate-pulse text-right">
                          💡 Click to view trophy ⟳
                        </div>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-gray-150/40 space-y-1.5">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Progress:</span>
                          {badge.isMultiMetric ? (
                            <p className="text-[10px] font-extrabold text-gray-600">{badge.progressText}</p>
                          ) : badge.isActionBased ? (
                            <p className="text-[10px] font-extrabold text-gray-600">Action: Launch startups</p>
                          ) : (
                            <div className="space-y-1">
                              <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className="h-full bg-orange-500"
                                  style={{ width: `${Math.min(100, (badge.current! / badge.target!) * 100)}%` }}
                                />
                              </div>
                              <p className="text-[10px] font-extrabold text-gray-600">
                                {badge.current}/{badge.target} {badge.metric}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* BACK SIDE (Trophy Details) */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border p-5 flex flex-col items-center justify-center text-center bg-gradient-to-br from-orange-500 to-amber-600 border-orange-600 text-white shadow-xl space-y-2">
                      <div className="text-4xl animate-bounce">🏆</div>
                      <h4 className="text-sm font-black uppercase tracking-widest">{badge.name}</h4>
                      {unlocked ? (
                        <div className="space-y-1">
                          <p className="text-[11px] font-extrabold text-orange-100">Milestone Completed!</p>
                          <p className="text-[10px] text-white/95 leading-relaxed bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 mt-1">
                            Verified on-campus contributor. Your feedback and projects help the IIML ecosystem thrive.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-amber-100">Currently Locked</p>
                          <p className="text-[10px] text-white/80 leading-relaxed mt-1">
                            Complete the progress goals shown on the front side to unlock this digital badge asset.
                          </p>
                        </div>
                      )}
                      <span className="text-[8px] font-black text-white/70 tracking-widest uppercase mt-2">
                        Click to Flip Back ⟳
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Ventures */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">⭐ Top Rated Ventures</h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Startups with highest average student ratings.</p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl" />
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
                        <span className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                          {venture.category}
                        </span>
                      </td>
                      <td className="py-3 pl-2 text-right font-extrabold text-orange-600">
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">👥 Top Community Contributors</h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Students supporting ventures with ratings and engagement.</p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl" />
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
