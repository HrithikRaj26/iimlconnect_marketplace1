"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalSearchBar from "./GlobalSearchBar";
import StreakWidget from "./StreakWidget";
import { 
  ShoppingBag, 
  Search, 
  Rocket, 
  ShieldAlert,
  MessageSquare,
  ArrowUpRight,
  PackagePlus,
  ClipboardList,
  Handshake,
  Compass
} from "lucide-react";

const SECTIONS = [
  {
    key: "marketplace",
    title: "Marketplace",
    description: "Buy, sell, and rent campus essentials with verified peers.",
    icon: ShoppingBag,
    accentClass: "text-teal-700 dark:text-teal-300",
    surfaceClass: "bg-teal-50/80 dark:bg-teal-950/20",
    actions: [
      { label: "Browse Listings", path: "/marketplace", icon: Compass },
      { label: "List Item", path: "/listing/create", icon: PackagePlus },
    ],
  },
  {
    key: "lostfound",
    title: "Lost & Found",
    description: "Report missing items or reunite found belongings quickly.",
    icon: Search,
    accentClass: "text-stone-700 dark:text-stone-200",
    surfaceClass: "bg-stone-100 dark:bg-stone-800/50",
    actions: [
      { label: "Browse Items", path: "/lost-found?tab=found", icon: Compass },
      { label: "Report Lost", path: "/lost-found/report/lost", icon: ClipboardList },
      { label: "Report Found", path: "/lost-found/report/found", icon: PackagePlus },
    ],
  },
  {
    key: "ventures",
    title: "Student Ventures",
    description: "Discover peer ventures, pitches, and founder updates.",
    icon: Rocket,
    accentClass: "text-amber-700 dark:text-amber-300",
    surfaceClass: "bg-amber-50/90 dark:bg-amber-950/20",
    actions: [
      { label: "Explore Hub", path: "/ventures", icon: Compass },
      { label: "Register Venture", path: "/ventures?tab=my-ventures", icon: Handshake },
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
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-[#111111] px-4 text-zinc-950 transition-colors dark:text-stone-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-14 pt-8 md:pt-10">
        <GlobalSearchBar firstName={firstName} />

        <section className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                  Quick Actions
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950 dark:text-stone-100">
                  Start where the task actually lives.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => router.push("/search")}
                className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-[0_14px_30px_-24px_rgba(24,24,27,0.45)] transition active:scale-[0.98] hover:border-teal-200 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200 dark:hover:border-teal-700 sm:flex"
              >
                Open Search
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {SECTIONS.map((section, index) => (
                <div
                  key={section.key}
                  className={`group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(24,24,27,0.55)] transition duration-300 hover:-translate-y-0.5 hover:border-teal-200 dark:border-stone-800 dark:bg-stone-950/80 dark:hover:border-teal-800 ${index === 0 ? "md:row-span-2 md:min-h-[18rem]" : ""}`}
                >
                  <div className="flex h-full flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${section.surfaceClass} ${section.accentClass}`}>
                        <section.icon strokeWidth={1.8} size={21} />
                      </div>
                      <ArrowUpRight className="mt-1 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal-700 dark:text-stone-700 dark:group-hover:text-teal-300" size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-950 dark:text-stone-100">{section.title}</h3>
                      <p className="mt-2 max-w-[34ch] text-sm leading-6 text-zinc-500 dark:text-stone-400">{section.description}</p>
                    </div>
                    <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {section.actions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => router.push(action.path)}
                            className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-sm font-semibold text-zinc-700 transition hover:border-teal-200 hover:bg-white hover:text-teal-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-stone-800 dark:bg-stone-900/70 dark:text-stone-200 dark:hover:border-teal-800 dark:hover:bg-stone-900"
                          >
                            <span>{action.label}</span>
                            <Icon size={16} strokeWidth={1.9} className="shrink-0 text-zinc-400 dark:text-stone-500" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push("/messages")}
              className="group w-full rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-left text-white shadow-[0_22px_50px_-32px_rgba(20,184,166,0.6)] transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-stone-800 dark:bg-stone-100 dark:text-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-teal-200 dark:bg-zinc-950/10 dark:text-teal-700">
                  <MessageSquare size={20} strokeWidth={1.8} />
                </div>
                <ArrowUpRight size={18} className="text-white/50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-zinc-950/40" />
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/80 dark:text-teal-700">Messages</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-normal">Keep deals moving.</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/65 dark:text-zinc-600">
                Pick up conversations with buyers, sellers, and handover contacts from one focused inbox.
              </p>
            </button>

            {userId && <StreakWidget userId={userId} />}
          </div>
        </section>

        {isAdmin && (
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
            >
              <ShieldAlert size={16} />
              Admin Console
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
