"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalSearchBar from "./GlobalSearchBar";
import StreakWidget from "./StreakWidget";
import { 
  ShoppingBag, 
  PlusCircle, 
  Search, 
  CheckCircle, 
  Rocket, 
  ShieldAlert,
  Box,
  MessageSquare
} from "lucide-react";

const SECTIONS = [
  {
    key: "marketplace",
    title: "Marketplace",
    emoji: "🛒",
    gradient: "from-blue-500 to-indigo-600",
    glow: "shadow-blue-500/20",
    border: "border-blue-100 dark:border-blue-900/30",
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    actions: [
      { icon: ShoppingBag, label: "Browse Listings", path: "/marketplace", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", hover: "group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50" },
      { icon: PlusCircle, label: "List Item", path: "/marketplace/new", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40", hover: "group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50" },
    ],
  },
  {
    key: "lostfound",
    title: "Lost & Found",
    emoji: "🔍",
    gradient: "from-purple-500 to-fuchsia-600",
    glow: "shadow-purple-500/20",
    border: "border-purple-100 dark:border-purple-900/30",
    bg: "bg-purple-50/60 dark:bg-purple-950/20",
    actions: [
      { icon: Box, label: "Browse Items", path: "/lost-found?tab=found", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", hover: "group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50" },
      { icon: Search, label: "Report Lost", path: "/lost-found/report/lost", color: "text-fuchsia-600 dark:text-fuchsia-400", bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40", hover: "group-hover:bg-fuchsia-100 dark:group-hover:bg-fuchsia-900/50" },
      { icon: CheckCircle, label: "Report Found", path: "/lost-found/report/found", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", hover: "group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50" },
    ],
  },
  {
    key: "ventures",
    title: "Student Ventures",
    emoji: "🚀",
    gradient: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/20",
    border: "border-orange-100 dark:border-orange-900/30",
    bg: "bg-orange-50/60 dark:bg-orange-950/20",
    actions: [
      { icon: Rocket, label: "Explore Hub", path: "/ventures", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40", hover: "group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50" },
      { icon: PlusCircle, label: "Register Venture", path: "/ventures?tab=my-ventures", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", hover: "group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50" },
    ],
  },
];

export default function WelcomeDashboard({ session }: { session: any }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session) {
      const metadata = session.user.user_metadata || {};
      const fullName = metadata.full_name || metadata.name || '';
      let fName = metadata.given_name || metadata.first_name || '';
      if (!fName && fullName) {
        fName = fullName.split(' ')[0];
      }
      setFirstName(fName);
      setUserId(session.user.id);

      if (session.user.email === 'pgp41298@iiml.ac.in') {
        setIsAdmin(true);
      }
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950 flex flex-col items-center px-4 transition-colors">
      {/* Hero greeting + search */}
      <GlobalSearchBar firstName={firstName} />

      {/* Platform sections */}
      <div className="w-full max-w-5xl mx-auto pb-12 space-y-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-center">
          Quick Actions
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SECTIONS.map((section) => (
            <div
              key={section.key}
              className={`rounded-2xl border ${section.border} ${section.bg} p-5 flex flex-col gap-4 transition-all duration-200`}
            >
              {/* Section header */}
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${section.gradient} text-white text-base shadow-md ${section.glow}`}>
                  {section.emoji}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{section.title}</p>
                </div>
              </div>

              {/* Gradient separator */}
              <div className={`h-px w-full bg-gradient-to-r ${section.gradient} opacity-20`} />

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                {section.actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => router.push(action.path)}
                    className={`group flex flex-col items-center gap-2 rounded-xl ${action.bg} ${action.hover} p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-white/80 dark:border-gray-700 ${action.color}`}>
                      <action.icon strokeWidth={1.8} size={20} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 text-center leading-tight group-hover:text-gray-900 dark:group-hover:text-white">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Messages shortcut */}
        <button
          type="button"
          onClick={() => router.push("/messages")}
          className="w-full flex items-center justify-between rounded-2xl border border-teal-100 dark:border-teal-900/30 bg-teal-50/60 dark:bg-teal-950/20 px-5 py-4 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all duration-200 group hover:shadow-sm active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/20">
              <MessageSquare size={18} strokeWidth={2} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Messages</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Chat with buyers and sellers</p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Activity Streaks Widget */}
      {userId && <StreakWidget userId={userId} />}

      {/* ADMIN CONSOLE */}
      {isAdmin && (
        <div className="mt-8 mb-12">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors border border-red-100 text-sm font-semibold gap-2 shadow-sm"
          >
            <ShieldAlert size={16} />
            Admin Console
          </button>
        </div>
      )}
    </div>
  );
}
