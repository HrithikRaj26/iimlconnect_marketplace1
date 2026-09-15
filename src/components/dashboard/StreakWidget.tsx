"use client";

import React, { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { getUserStreaks } from "@/services/streakService";
import { Flame, Package, Star } from "lucide-react";

interface StreakRow {
  label: string;
  icon: React.ElementType;
  current: number;
  best?: number;
  unit: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

function getMilestoneLabel(current: number): string | null {
  if (current >= 30) return "Legendary run";
  if (current >= 14) return "Strong streak";
  if (current >= 7) return "One week held";
  if (current >= 3) return "Momentum building";
  return null;
}

interface StreakWidgetProps {
  userId: string;
}

export default function StreakWidget({ userId }: StreakWidgetProps) {
  const [streaks, setStreaks] = useState<{
    loginCurrent: number;
    loginBest: number;
    sellerCurrent: number;
    reviewCurrent: number;
    reviewBest: number;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;
    getUserStreaks(userId).then((data) => {
      setStreaks({
        loginCurrent: data.login_streak_current,
        loginBest: data.login_streak_best,
        sellerCurrent: data.seller_streak_current,
        reviewCurrent: data.review_streak_current,
        reviewBest: data.review_streak_best,
      });
    });
  }, [userId]);

  if (!streaks) return null;

  const rows: StreakRow[] = [
    {
      label: "Daily Login",
      icon: Flame,
      current: streaks.loginCurrent,
      best: streaks.loginBest,
      unit: "days",
      color: "text-teal-700 dark:text-teal-300",
      bgColor: "bg-teal-50/80 dark:bg-teal-950/20",
      borderColor: "border-teal-200 dark:border-teal-900/70",
    },
    {
      label: "Weekly Listing",
      icon: Package,
      current: streaks.sellerCurrent,
      unit: "weeks",
      color: "text-zinc-700 dark:text-stone-200",
      bgColor: "bg-zinc-50 dark:bg-stone-900/70",
      borderColor: "border-zinc-200 dark:border-stone-800",
    },
    {
      label: "Review Streak",
      icon: Star,
      current: streaks.reviewCurrent,
      best: streaks.reviewBest,
      unit: "reviews",
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-50/90 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-900/70",
    },
  ];

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const row: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } }}
    >
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-[0_18px_45px_-36px_rgba(24,24,27,0.5)] dark:border-stone-800 dark:bg-stone-950/80">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={16} className="text-teal-700 dark:text-teal-300" />
          <h2 className="text-[11px] font-semibold text-zinc-400 dark:text-stone-500 uppercase tracking-[0.18em]">
            Activity Streaks
          </h2>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-3"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {rows.map((r) => {
            const Icon = r.icon;
            const isHot = r.current >= 3;
            const milestone = getMilestoneLabel(r.current);

            return (
              <motion.div
                key={r.label}
                variants={row}
                className={`relative flex items-center gap-3 overflow-hidden rounded-xl border p-4 ${r.bgColor} ${r.borderColor}`}
              >
                {/* Icon */}
                <div
                  className={`relative flex items-center justify-center w-10 h-10 rounded-lg ${r.bgColor} border ${r.borderColor} shrink-0`}
                >
                  <Icon
                    size={18}
                    className={r.color}
                  />
                </div>

                {/* Numbers */}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate">
                    {r.label}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className={`text-2xl font-black ${r.color}`}>
                      {r.current}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      {r.unit}
                    </span>
                  </div>
                  {milestone ? (
                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {milestone}
                    </p>
                  ) : r.best && r.best > 0 ? (
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 mt-0.5">
                      Best {r.best} {r.unit}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
