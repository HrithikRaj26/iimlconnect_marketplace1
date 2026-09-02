"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LoginView from "@/components/auth/LoginView";
import WelcomeDashboard from "@/components/dashboard/WelcomeDashboard";
import AppLayout from "@/components/layout/AppLayout";

import { Loader } from "@/components/ui/Loader";

export default function RootPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeSession = session || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("iiml-demo-session") || "null") : null);
      setSession(activeSession);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeSession = session || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("iiml-demo-session") || "null") : null);
      setSession(activeSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <Loader fullscreen message="Verifying session..." />;
  }

  if (!session) {
    return <LoginView onLogin={(session) => setSession(session)} />;
  }

  return (
    <AppLayout>
      <WelcomeDashboard session={session} />
    </AppLayout>
  );
}
