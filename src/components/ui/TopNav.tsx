import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MessageSquare, LogOut, Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

interface TopNavProps {
  /** Which nav item to highlight as active. */
  active?: "marketplace" | "listings" | "messages" | "ventures";
  onMenuClick?: () => void;
  profile?: { name: string; avatar: string } | null;
}

export function TopNav({ active = "marketplace", onMenuClick, profile: propProfile }: TopNavProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [profile, setProfile] = useState<{ name: string; avatar: string } | null>(propProfile || null);
  const [unreadChats, setUnreadChats] = useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

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

  useEffect(() => {
    let channel: any;
    let isMounted = true;

    const fetchUnread = async (userId: string) => {
      try {
        const { data: convs } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("profile_id", userId);

        if (convs && convs.length > 0) {
          const ids = convs.map((c: any) => c.conversation_id);
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("conversation_id", ids)
            .neq("sender_id", userId)
            .eq("is_read", false);

          if (isMounted) setUnreadChats(count || 0);
        } else {
          if (isMounted) setUnreadChats(0);
        }
      } catch (e) {
        console.error("Error fetching unread count:", e);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isMounted) {
        const userId = session.user.id;
        fetchUnread(userId);

        const channelName = `top-nav-unread-${userId}-${Date.now()}`;
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "messages" },
            () => {
              fetchUnread(userId);
            }
          )
          .subscribe();
      }
    });

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const linkClass = (key: TopNavProps["active"]) =>
    key === active ? "text-brand" : "text-gray-500 hover:text-gray-800";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button onClick={onMenuClick} className="text-gray-500 hover:text-gray-900 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-transparent">
            <img src="/favicon.svg" alt="IIML Connect Logo" className="h-8 w-8 object-contain" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              IIML <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Connect</span>
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          href="/messages" 
          className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/60 border border-blue-100/80 dark:border-blue-900/40 shadow-xs hover:shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 mr-2" 
          title="Messages"
        >
          <MessageSquare size={18} strokeWidth={2.2} />
          {unreadChats > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white dark:ring-gray-900 animate-bounce shadow-md">
              {unreadChats}
            </span>
          )}
        </Link>
        
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
        
        {/* Theme toggle: two-button pill */}
        <div className="flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5">
          <button
            onClick={() => theme !== 'light' && toggle()}
            title="Light Mode"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 ${
              theme === 'light'
                ? 'bg-white dark:bg-gray-900 text-amber-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Sun size={13} />
            <span className="hidden sm:inline">Light</span>
          </button>
          <button
            onClick={() => theme !== 'dark' && toggle()}
            title="Dark Mode"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-gray-900 text-blue-400 shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Moon size={13} />
            <span className="hidden sm:inline">Dark</span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
