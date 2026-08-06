import Link from "next/link";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface TopNavProps {
  /** Which nav item to highlight as active. */
  active?: "marketplace" | "listings" | "messages" | "ventures";
  onMenuClick?: () => void;
  profile?: { name: string; avatar: string } | null;
}

export function TopNav({ active = "marketplace", onMenuClick, profile: propProfile }: TopNavProps) {
  const [profile, setProfile] = useState<{ name: string; avatar: string } | null>(propProfile || null);

  useEffect(() => {
    if (propProfile) {
      setProfile(propProfile);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const metadata = session.user.user_metadata || {};
          const fullName = metadata.full_name || metadata.name || '';
          let fName = metadata.given_name || metadata.first_name || '';
          if (!fName && fullName) {
            fName = fullName.split(' ')[0];
          }
          const avatar = metadata.avatar_url || metadata.picture || '';
          setProfile({ name: fullName || fName || "Student", avatar });
        }
      } catch (e) {
        console.error("Error loading top nav profile:", e);
      }
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const fullName = metadata.full_name || metadata.name || '';
        let fName = metadata.given_name || metadata.first_name || '';
        if (!fName && fullName) {
          fName = fullName.split(' ')[0];
        }
        const avatar = metadata.avatar_url || metadata.picture || '';
        setProfile({ name: fullName || fName || "Student", avatar });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [propProfile]);

  const linkClass = (key: TopNavProps["active"]) =>
    key === active ? "text-brand" : "text-gray-500 hover:text-gray-800";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-6 shrink-0">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button onClick={onMenuClick} className="text-gray-500 hover:text-gray-900 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 12l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900">
              IIML <span className="text-brand">Connect</span>
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex mr-2">
          <Link href="/marketplace" className={linkClass("marketplace")}>
            Marketplace
          </Link>
          <Link href="/listing/create" className={linkClass("listings")}>
            Sell an Item
          </Link>
          <Link href="/messages" className={linkClass("messages")}>
            Messages
          </Link>
        </nav>
        
        {/* User Profile Avatar Link in Header */}
        <Link 
          href="/profile" 
          title="Edit Profile"
          className="flex items-center gap-2 rounded-xl p-1 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
        >
          {profile?.avatar ? (
            <img src={profile.avatar} alt="User Avatar" className="h-8 w-8 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              {profile?.name ? profile.name[0].toUpperCase() : "👤"}
            </div>
          )}
          <span className="hidden sm:inline text-xs font-bold text-gray-700 max-w-[100px] truncate">
            {profile?.name || "My Profile"}
          </span>
        </Link>
      </div>
    </header>
  );
}
