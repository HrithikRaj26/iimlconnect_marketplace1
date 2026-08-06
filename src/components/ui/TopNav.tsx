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
    let channel: any = null;

    const fetchUnread = async (userId: string) => {
      try {
        const { data: convs } = await supabase
          .from("conversations")
          .select("id")
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

        if (convs && convs.length > 0) {
          const ids = convs.map((c) => c.id);
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("conversation_id", ids)
            .neq("sender_id", userId)
            .eq("is_read", false);

          setUnreadChats(count || 0);
        } else {
          setUnreadChats(0);
        }
      } catch (e) {
        console.error("Error fetching unread count:", e);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userId = session.user.id;
        fetchUnread(userId);

        channel = supabase
          .channel("top-nav-unread")
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
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const linkClass = (key: TopNavProps["active"]) =>
    key === active ? "text-brand" : "text-gray-500 hover:text-gray-800";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 shrink-0">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button onClick={onMenuClick} className="text-gray-500 hover:text-gray-900 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/15">
            <Sparkles size={16} className="animate-pulse" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              IIML <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Connect</span>
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/messages" className="relative hidden md:flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors mr-2 text-gray-500 hover:text-gray-900" title="Messages">
          <MessageSquare size={20} />
          {unreadChats > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[9px] font-black text-white ring-2 ring-white">
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
        
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

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
