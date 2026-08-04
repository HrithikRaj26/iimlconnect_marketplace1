"use client";

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type LostFoundRole = "user" | "custodian" | "admin";

/** Reads {session, userId, role} — Marketplace has no role concept yet, so this is Lost & Found-specific. */
export function useLostFoundAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => subscription.unsubscribe();
  }, []);

  const role = ((): LostFoundRole => {
    const r = session?.user?.app_metadata?.role;
    return r === "custodian" || r === "admin" ? r : "user";
  })();

  return { session, userId: session?.user.id, role, loading };
}
