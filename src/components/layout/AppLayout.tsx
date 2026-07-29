"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/ui/TopNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Can default to true on desktop if preferred
  const [profile, setProfile] = useState<{ name: string; avatar: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) updateProfile(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) updateProfile(session);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = (session: any) => {
    const metadata = session.user.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || '';
    let fName = metadata.given_name || metadata.first_name || '';
    if (!fName && fullName) {
      fName = fullName.split(' ')[0];
    }
    const avatar = metadata.avatar_url || metadata.picture || '';
    setProfile({ name: fullName || fName || "Student", avatar });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Desktop Push / Mobile Overlay */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 transform bg-white border-r border-gray-200 transition-all duration-300 ease-in-out sm:relative sm:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl sm:shadow-none sm:w-64" : "-translate-x-full sm:w-0"
        } ${!sidebarOpen ? "sm:hidden" : "sm:block"}`}
      >
        <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden w-64">
          {/* Sidebar Header with Profile */}
          <div className="flex flex-col items-center p-6 border-b border-gray-100 bg-gray-50/50">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Profile" className="h-20 w-20 rounded-full object-cover shadow-sm mb-3 border-2 border-white" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm mb-3 border-2 border-white">
                {profile?.name ? profile.name[0].toUpperCase() : "?"}
              </div>
            )}
            <h2 className="text-lg font-bold text-gray-900 text-center leading-tight truncate w-full px-2">{profile?.name || "Welcome"}</h2>
            <p className="text-xs text-gray-500 mt-1">Verified Student</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <Link 
              href="/" 
              onClick={() => setSidebarOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname === "/" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              🏠 Dashboard
            </Link>
            <Link 
              href="/profile" 
              onClick={() => setSidebarOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname.startsWith("/profile") ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              👤 My Profile
            </Link>
            <Link 
              href="/marketplace" 
              onClick={() => setSidebarOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname.startsWith("/marketplace") ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              🛒 Buy and Sell
            </Link>
            <Link 
              href="#" 
              className={`block px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
            >
              🔍 Lost and Found
            </Link>
            <Link 
              href="#" 
              className={`block px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
            >
              🚀 Venture Hub
            </Link>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 transition-all duration-300">
        <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

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
