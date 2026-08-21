"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronUp, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/ui/TopNav";
import { checkAndUpdateLoginStreak } from "@/services/streakService";
import { motion, AnimatePresence } from "framer-motion";
import { playWelcomeSound } from "@/utils/audio";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; avatar: string; isGuest?: boolean } | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      let isScrolled = false;
      if (mainRef.current) {
        isScrolled = mainRef.current.scrollTop > 300;
      }
      if (typeof window !== "undefined" && !isScrolled) {
        isScrolled = window.scrollY > 300;
      }
      setShowScrollTop(isScrolled);
    };

    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (mainElement) {
        mainElement.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getScrollToTopColorClass = () => {
    // 🟠 Ventures — orange/amber brand
    if (pathname.startsWith("/ventures")) {
      return "from-orange-500 to-amber-500 shadow-orange-500/30 hover:shadow-orange-500/50";
    }
    // 🟣 Lost & Found — purple/fuchsia
    if (pathname.startsWith("/lost-found")) {
      return "from-purple-600 to-fuchsia-600 shadow-purple-500/30 hover:shadow-purple-500/50";
    }
    // 💬 Messages — teal/cyan
    if (pathname.startsWith("/messages")) {
      return "from-teal-500 to-cyan-500 shadow-teal-500/30 hover:shadow-teal-500/50";
    }
    // 👤 Profile — violet/slate
    if (pathname.startsWith("/profile")) {
      return "from-violet-600 to-slate-600 shadow-violet-500/30 hover:shadow-violet-500/50";
    }
    // 🛒 Marketplace & listing create flow — blue/indigo
    if (pathname.startsWith("/marketplace") || pathname.startsWith("/listing")) {
      return "from-blue-600 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/50";
    }
    // 🔍 Search — sky/blue
    if (pathname.startsWith("/search")) {
      return "from-sky-500 to-blue-500 shadow-sky-500/30 hover:shadow-sky-500/50";
    }
    // 🛡️ Admin — red/rose
    if (pathname.startsWith("/admin")) {
      return "from-red-600 to-rose-600 shadow-red-500/30 hover:shadow-red-500/50";
    }
    // 🏠 Dashboard / home — brand blue/indigo (default)
    return "from-blue-600 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/50";
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        updateProfile(session);
        const welcomeKey = "iiml-welcome-chime-played";
        const hasPlayed = sessionStorage.getItem(welcomeKey);
        if (!hasPlayed) {
          playWelcomeSound();
          sessionStorage.setItem(welcomeKey, "true");
        }
        // Fire-and-forget: update daily login streak
        checkAndUpdateLoginStreak(session.user.id);
      } else {
        // No session — redirect to login page
        router.replace('/');
      }
      setSessionChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        updateProfile(session);
        const welcomeKey = "iiml-welcome-chime-played";
        const hasPlayed = sessionStorage.getItem(welcomeKey);
        if (!hasPlayed) {
          playWelcomeSound();
          sessionStorage.setItem(welcomeKey, "true");
        }
      } else {
        setProfile(null);
        router.replace('/');
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfile = (session: any) => {
    const metadata = session.user.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || '';
    let fName = metadata.given_name || metadata.first_name || '';
    if (!fName && fullName) {
      fName = fullName.split(' ')[0];
    }
    const avatar = metadata.custom_avatar || metadata.avatar_url || metadata.picture || '';
    const isGuest = metadata.is_guest || !session.user.email || !!session.user.phone;
    const defaultName = isGuest ? "Guest" : "Student";
    setProfile({ name: fullName || fName || defaultName, avatar, isGuest });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Block render until session check resolves (prevents flash of protected content)
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-[55] bg-gray-900/40 backdrop-blur-sm sm:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop Collapsible / Mobile Overlay */}
      <div 
        className={`fixed inset-y-0 left-0 z-[60] w-64 shrink-0 transform bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out sm:relative sm:z-0 ${
          sidebarOpen 
            ? "translate-x-0 shadow-2xl sm:shadow-none w-64 block" 
            : "-translate-x-full w-0 hidden sm:hidden"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden w-64 bg-white dark:bg-gray-900">
          {/* Sidebar Header with Profile */}
          <div className="flex flex-col items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Profile" className="h-20 w-20 rounded-full object-cover shadow-sm mb-3 border-2 border-white dark:border-gray-800" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm mb-3 border-2 border-white dark:border-gray-800">
                {profile?.name ? profile.name[0].toUpperCase() : "👤"}
              </div>
            )}
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center leading-tight truncate w-full px-2">{profile?.name || "Welcome"}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {profile?.isGuest ? "External Guest" : "Verified Student"}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 bg-white dark:bg-gray-900">
            <Link 
              href="/" 
              onClick={() => setSidebarOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname === "/" ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"}`}
            >
              🏠 Dashboard
            </Link>
            <Link 
              href="/profile" 
              onClick={() => setSidebarOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname.startsWith("/profile") ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"}`}
            >
              👤 My Profile
            </Link>
            <Link 
              href="/marketplace" 
              onClick={() => setSidebarOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname.startsWith("/marketplace") ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"}`}
            >
              🛒 Buy and Sell
            </Link>
            <Link
              href="/lost-found"
              onClick={() => setSidebarOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname.startsWith("/lost-found") ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"}`}
            >
              🔍 Lost and Found
            </Link>
            <Link 
              href="/ventures" 
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname.startsWith("/ventures") ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"}`}
            >
              🚀 Venture Hub
            </Link>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 transition-all duration-300">
        <TopNav 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          profile={profile} 
          active={
            pathname.startsWith("/ventures") ? "ventures" :
            pathname.startsWith("/messages") ? "messages" :
            pathname.startsWith("/listing/create") ? "listings" :
            "marketplace"
          } 
        />
        <main ref={mainRef} className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1">
            {profile && (profile.name === "Guest" || profile.name === "Student" || !profile.name.trim()) && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 font-extrabold text-xs py-3 px-4 text-center flex flex-wrap items-center justify-center gap-2 shadow-xs animate-pulse">
                <span>⚠️ Your profile is incomplete. Please set your actual name to complete registration.</span>
                <Link href="/profile" className="underline font-black hover:text-amber-950 dark:hover:text-amber-300">
                  Update Profile Now →
                </Link>
              </div>
            )}
            {children}
          </div>
          
          {/* Beautiful Platform Footer */}
          <footer className="w-full bg-white dark:bg-gray-900 border-t border-gray-150 dark:border-gray-800 px-6 py-10 mt-12 bg-gradient-to-b from-transparent to-gray-50/40 dark:to-gray-950/40">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand and Info */}
              <div className="space-y-3 col-span-1 md:col-span-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/15">
                    <Sparkles size={16} className="animate-pulse" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      IIML <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Connect</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                  The unified hub for IIM Lucknow. Rent or buy listings, submit startup pitches, coordinate late-night items, and connect with peer student founders securely.
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Platform Map</h4>
                <ul className="space-y-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                  <li>
                    <Link href="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">🏠 Dashboard</Link>
                  </li>
                  <li>
                    <Link href="/marketplace" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">🛒 Marketplace</Link>
                  </li>
                  <li>
                    <Link href="/lost-found" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">🔍 Lost & Found</Link>
                  </li>
                </ul>
              </div>

              {/* Support & Tech Column */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Support & SLA</h4>
                <ul className="space-y-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                  <li>
                    <a href="mailto:support@iiml.ac.in" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">✉️ Helpdesk Email</a>
                  </li>
                  <li>
                    <span className="text-gray-500 dark:text-gray-400">📄 Version 1.4.2</span>
                  </li>
                  <li>
                    <span className="text-gray-450 dark:text-gray-500 text-[10px]">L-Campus Connect</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-gray-100 dark:border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                &copy; {new Date().getFullYear()} IIM Lucknow Connect. All rights reserved.
              </p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                Built with ❤️ by Student Founders for the IIML Ecosystem
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* Floating Scroll to Top Button — color matches current page */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="scroll-top-btn"
            onClick={scrollToTop}
            className={`fixed bottom-24 right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-xl border border-white/10 hover:brightness-110 transition-[filter] ${getScrollToTopColorClass()}`}
            title="Scroll to Top"
            initial={{ opacity: 0, scale: 0.6, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0,
              transition: { type: "spring", stiffness: 420, damping: 26 } }}
            exit={{ opacity: 0, scale: 0.6, y: 16,
              transition: { duration: 0.15, ease: "easeIn" } }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronUp size={22} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 sm:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
