"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import VentureDiscovery from "@/components/ventures/VentureDiscovery";
import CommunityFeed from "@/components/ventures/CommunityFeed";
import ReputationLeaderboard from "@/components/ventures/ReputationLeaderboard";
import MyVentures from "@/components/ventures/MyVentures";
import AdminPanel from "@/components/ventures/AdminPanel";

import { Loader } from "@/components/ui/Loader";

type TabId = "discover" | "feed" | "reputation" | "my-ventures" | "admin";

export default function VenturesPage() {
  return (
    <Suspense fallback={<Loader fullscreen message="Entering Venture Hub..." />}>
      <VenturesPageInner />
    </Suspense>
  );
}

function VenturesPageInner() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "discover";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email === "pgp41298@iiml.ac.in" || session?.user?.email === "pgp41103@iiml.ac.in") {
        setIsAdmin(true);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email === "pgp41298@iiml.ac.in" || session?.user?.email === "pgp41103@iiml.ac.in") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync tab state if URL query parameter changes
  useEffect(() => {
    const urlTab = searchParams.get("tab") as TabId;
    if (urlTab && ["discover", "feed", "reputation", "my-ventures", "admin"].includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]);

  if (loading) {
    return <Loader fullscreen message="Entering Venture Hub..." />;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 text-center">
        <div className="max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <span className="text-4xl">🔒</span>
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Please log in from the main portal to access the Student Venture Hub & Community.
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; adminOnly?: boolean }[] = [
    { id: "discover", label: "Discover" },
    { id: "reputation", label: "Trust" },
    { id: "feed", label: "Participate" },
    { id: "my-ventures", label: "Build" },
    { id: "admin", label: "Console", adminOnly: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        {/* Top Banner and Heading */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded">
                  IIML Enterprise Journal
                </span>
                <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 dark:text-white md:text-3xl mt-3">
                  The Campus Enterprise Network
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 md:text-base max-w-2xl leading-relaxed">
                  A curated ecosystem for student-led startups and campus services. Read verified peer journals, recommend trusted operations, and co-build products.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {activeTab !== "my-ventures" && (
                  <button
                    onClick={() => setActiveTab("my-ventures")}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 hover:shadow transition-all"
                  >
                    + Register Your Venture
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-8 overflow-x-auto">
              <nav className="flex space-x-1 rounded-md bg-gray-100 dark:bg-gray-805 p-1" aria-label="Tabs">
                {tabs
                  .filter((tab) => !tab.adminOnly || isAdmin)
                  .map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-bold transition-all ${isActive
                          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white"
                          }`}
                      >
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main View Container */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {activeTab === "discover" && <VentureDiscovery />}
          {activeTab === "feed" && <CommunityFeed />}
          {activeTab === "reputation" && <ReputationLeaderboard />}
          {activeTab === "my-ventures" && <MyVentures />}
          {activeTab === "admin" && isAdmin && <AdminPanel />}
        </main>
    </div>
  );
}
