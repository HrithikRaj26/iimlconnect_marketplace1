"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LoginView from "@/components/auth/LoginView";
import WelcomeDashboard from "@/components/dashboard/WelcomeDashboard";
import AppLayout from "@/components/layout/AppLayout";

export default function RootPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!session) {
    return <LoginView onLogin={(session) => setSession(session)} />;
  }

  return (
    <AppLayout>
      <WelcomeDashboard session={session} onLogout={() => setSession(null)} />
    </AppLayout>
  );
}
