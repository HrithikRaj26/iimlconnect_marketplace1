import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MessageSquare, LogOut, Sparkles, Sun, Moon } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface TopNavProps {
  /** Which nav item to highlight as active. */
  active?: "marketplace" | "listings" | "messages" | "ventures";
  onMenuClick?: () => void;
  profile?: { name: string; avatar: string } | null;
}

export function TopNav({ active = "marketplace", onMenuClick, profile: propProfile }: TopNavProps) {
  const router = useRouter();
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
          const avatar = metadata.custom_avatar || metadata.avatar_url || metadata.picture || '';
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
        const avatar = metadata.custom_avatar || metadata.avatar_url || metadata.picture || '';
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
          .from("conversations")
          .select("id")
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

        if (convs && convs.length > 0) {
          const ids = convs.map((c: any) => c.id);
          const { data: msgs } = await supabase
            .from("messages")
            .select("id, conversation_id, sender_id, is_read")
            .in("conversation_id", ids)
            .neq("sender_id", userId);

          // Sync with local fallback read messages
          let readMessageIds: string[] = [];
          if (typeof window !== "undefined") {
            try {
              const stored = localStorage.getItem("iiml-read-messages");
              readMessageIds = stored ? JSON.parse(stored) : [];
            } catch {}
          }

          // Count THREADS with unread (not individual messages), matching sidebar behavior
          const unreadByConv = new Set<string>();
          (msgs || []).forEach((m: any) => {
            const isRead = m.is_read === true || readMessageIds.includes(m.id);
            if (!isRead) unreadByConv.add(m.conversation_id);
          });

          if (isMounted) setUnreadChats(unreadByConv.size);
        } else {
          if (isMounted) setUnreadChats(0);
        }
      } catch (e) {
        console.error("Error fetching unread count:", e);
      }
    };

    let userId: string | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isMounted) {
        userId = session.user.id;
        fetchUnread(userId);

        const channelName = `top-nav-unread-${userId}-${Date.now()}`;
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "messages" },
            () => {
              if (userId) fetchUnread(userId);
            }
          )
          .subscribe();
      }
    });

    // Re-fetch when a chat is opened (dispatched by messages page after markAsRead)
    const handleReadUpdated = () => {
      if (userId) fetchUnread(userId);
    };
    window.addEventListener("iiml-read-updated", handleReadUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("iiml-read-updated", handleReadUpdated);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);


  const linkClass = (key: TopNavProps["active"]) =>
    key === active ? "text-brand dark:text-brand-light" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 md:px-6 shrink-0 z-30">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Toggle navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg p-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-transparent">
            <img src="/favicon.svg" alt="IIML Connect Logo" className="h-8 w-8 object-contain" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              IIML <span className="text-blue-600 dark:text-blue-400 font-extrabold">Connect</span>
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link 
          href="/messages" 
          className="relative flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors" 
          title="Messages"
          aria-label={unreadChats > 0 ? `Messages (${unreadChats} unread)` : "Messages"}
        >
          <MessageSquare size={19} strokeWidth={2} />
          {unreadChats > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm">
              {unreadChats}
            </span>
          )}
        </Link>
        
        {/* User Profile Avatar Link in Header */}
        <Link 
          href="/profile" 
          title="Edit Profile"
          aria-label="Edit Profile"
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
        >
          {profile?.avatar ? (
            <img src={profile.avatar} alt="User Avatar" className="h-7 w-7 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {profile?.name ? profile.name[0].toUpperCase() : "S"}
            </div>
          )}
          <span className="hidden sm:inline text-xs font-semibold text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
            {profile?.name || "My Profile"}
          </span>
        </Link>
        
        {/* Theme toggle */}
        <ThemeToggle />

        <button
          type="button"
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Sign Out"
          className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
