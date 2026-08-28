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
    icon: ShoppingBag,
    colorClass: "bg-blue-600 dark:bg-blue-700",
    borderClass: "border-t-4 border-t-blue-600 dark:border-t-blue-500",
    actions: [
      { label: "Browse Listings", path: "/marketplace" },
      { label: "List Item", path: "/marketplace/new" },
    ],
  },
  {
    key: "lostfound",
    title: "Lost & Found",
    icon: Search,
    colorClass: "bg-purple-600 dark:bg-purple-700",
    borderClass: "border-t-4 border-t-purple-600 dark:border-t-purple-500",
    actions: [
      { label: "Browse Items", path: "/lost-found?tab=found" },
      { label: "Report Lost", path: "/lost-found/report/lost" },
      { label: "Report Found", path: "/lost-found/report/found" },
    ],
  },
  {
    key: "ventures",
    title: "Student Ventures",
    icon: Rocket,
    colorClass: "bg-orange-600 dark:bg-orange-700",
    borderClass: "border-t-4 border-t-orange-600 dark:border-t-orange-500",
    actions: [
      { label: "Explore Hub", path: "/ventures" },
      { label: "Register Venture", path: "/ventures?tab=my-ventures" },
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
              className={`rounded-md border border-gray-200 dark:border-gray-800 ${section.borderClass} bg-white dark:bg-gray-900 p-5 flex flex-col gap-4 transition-all duration-200`}
            >
              {/* Section header */}
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${section.colorClass} text-white shadow-xs`}>
                  <section.icon strokeWidth={1.8} size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{section.title}</p>
                </div>
              </div>

              {/* Divider separator */}
              <div className="h-px w-full bg-gray-100 dark:bg-gray-800/60" />

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                {section.actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => router.push(action.path)}
                    className="group flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 p-4 transition-all duration-150 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent active:scale-95 min-h-[3.5rem]"
                  >
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 text-center leading-tight group-hover:text-black dark:group-hover:text-white transition-colors">
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
          className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 border-l-4 border-l-teal-600 dark:border-l-teal-500 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all duration-200 group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-600 dark:bg-teal-700 text-white shadow-xs">
              <MessageSquare size={18} strokeWidth={2} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Messages</p>
              <p className="text-xs text-gray-450 dark:text-gray-500">Chat with buyers and sellers</p>
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
            className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors border border-red-100 text-sm font-semibold gap-2 shadow-sm"
          >
            <ShieldAlert size={16} />
            Admin Console
          </button>
        </div>
      )}
    </div>
  );
}
