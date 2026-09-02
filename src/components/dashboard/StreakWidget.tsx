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
  if (current >= 30) return "Legendary! 🏆";
  if (current >= 14) return "On Fire! 🔥";
  if (current >= 7) return "Blazing! ⚡";
  if (current >= 3) return "Warming up 🌡️";
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
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
    {
      label: "Weekly Listing",
      icon: Package,
      current: streaks.sellerCurrent,
      unit: "weeks",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      label: "Review Streak",
      icon: Star,
      current: streaks.reviewCurrent,
      best: streaks.reviewBest,
      unit: "reviews",
      color: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200 dark:border-amber-800",
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
      className="w-full max-w-6xl mx-auto mt-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } }}
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl px-6 py-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={16} className="text-orange-500" />
          <h2 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Activity Streaks
          </h2>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
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
                className={`relative flex items-center gap-3 p-4 rounded-xl border ${r.bgColor} ${r.borderColor} overflow-hidden`}
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
                      Best: {r.best} {r.unit}
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
