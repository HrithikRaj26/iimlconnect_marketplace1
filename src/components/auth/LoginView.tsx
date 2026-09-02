"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, Sparkles, LogIn, ArrowLeft, Home, ShoppingBag, Search, Mail, FileText, AlertCircle, UserCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function LoginView({ onLogin }: { onLogin: (session: any) => void }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const [guestName, setGuestName] = useState("");
  const [savedSession, setSavedSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { activeTheme } = useTheme();

  const handleDemoStudentLogin = () => {
    const demoSession = {
      user: {
        id: "demo-student-user",
        email: "student@iiml.ac.in",
        user_metadata: {
          full_name: "Aman Sharma",
          name: "Aman Sharma",
          batch: "PGP 2024-26",
          avatar_url: ""
        }
      },
      access_token: "demo-access-token",
      refresh_token: "demo-refresh-token"
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("iiml-demo-session", JSON.stringify(demoSession));
    }
    onLogin(demoSession);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: "115760004033-6o92pdosobhjkhe1gjs54ls93oqa5rfb.apps.googleusercontent.com",
        callback: handleGoogleLogin,
      });
      const container = document.getElementById("gsi-container");
      if (container) {
        container.innerHTML = "";
        (window as any).google.accounts.id.renderButton(
          container,
          {
            theme: activeTheme === "dark" ? "filled_black" : "outline",
            size: "large",
            width: "320",
            text: "continue_with",
            shape: "pill"
          }
        );
      }
    }
  }, [activeTheme]);

  const handleGoogleLogin = async (response: any) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) throw error;
      if (data?.session) {
        onLogin(data.session);
      }
    } catch (err: any) {
      setAuthError("Google Sign-In failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setAuthError(null);
    let cleaned = phone.trim().replace(/[\s\-()]/g, "");
    if (cleaned.length < 10) {
      setAuthError("Please enter a valid 10-digit phone number.");
      return;
    }
    
    // Prepends +91 for 10-digit numbers or + if country code exists but lacks '+' prefix
    if (cleaned.length === 10 && !cleaned.startsWith("+")) {
      cleaned = "+91" + cleaned;
    } else if (!cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }
    
    setPhone(cleaned);

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });
    setLoading(false);
    if (error) {
      setAuthError("Error sending OTP: " + error.message);
    } else {
      setStep("otp");
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    setLoading(false);
    if (error) {
      setAuthError("Invalid OTP code. Please check and try again.");
    } else {
      const user = data.user;
      const metadata = user?.user_metadata || {};
      const hasName = metadata.full_name || metadata.name || metadata.given_name;
      
      if (!hasName) {
        setSavedSession(data.session);
        setStep("name");
      } else {
        onLogin(data.session);
      }
    }
  };

  const saveGuestName = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!guestName.trim()) {
      setAuthError("Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: guestName.trim(),
          is_guest: true,
          batch: "External Guest"
        }
      });
      if (error) throw error;
      
      // Fetch updated session details
      const { data: { session } } = await supabase.auth.getSession();
      onLogin(session || savedSession);
    } catch (err: any) {
      setAuthError("Failed to save name: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Main split grid */}
      <div className="flex flex-1 flex-col lg:flex-row max-w-7xl mx-auto w-full items-center justify-center gap-12 px-6 py-12 z-10">
        
        {/* Left Side: Stats & Brand Pitch */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 lg:max-w-xl space-y-8 text-center lg:text-left mt-8 lg:mt-0"
        >
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
            <Sparkles size={12} className="animate-spin-slow" />
            <span>Welcome to IIML Connect</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-gray-100 leading-tight">
            The exclusive <br className="hidden lg:block" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">campus marketplace</span> <br />
            & venture ecosystem.
          </h1>

          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Buy and sell pre-owned items, order from student-run ventures, and report lost-and-found candidates securely within the IIM Lucknow network.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 pt-4">
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-4 backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200">
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">500+</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Items Listed</p>
            </div>
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-4 backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200">
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">25+</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Student Startups</p>
            </div>
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-4 backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200">
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">150+</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Matches Resolved</p>
            </div>
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-4 backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200">
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">98%</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Match Success</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
        >
          {/* Card branding header */}
          <div className="text-center mb-6">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-transparent mb-3">
              <img src="/favicon.svg" alt="IIML Connect Logo" className="h-12 w-12 object-contain" />
            </span>
            
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              IIML <span className="text-blue-600 dark:text-blue-400">Connect</span>
            </h2>
            <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Campus Verification & Single Sign-On
            </p>
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div 
              role="alert" 
              className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-300 flex items-start gap-2"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1 leading-relaxed">{authError}</div>
              <button 
                type="button" 
                onClick={() => setAuthError(null)} 
                className="shrink-0 text-red-500 hover:text-red-700 dark:hover:text-red-300 ml-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form container */}
          <div className="relative overflow-hidden min-h-[170px]">
            <AnimatePresence mode="wait">
              {step === "phone" && (
                <motion.div
                  key="phone-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-gray-500">
                        <Phone size={16} />
                      </div>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={sendOtp} 
                    disabled={loading || !phone} 
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending OTP...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <LogIn size={15} />
                        Send Verification Code
                      </span>
                    )}
                  </button>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.form
                  key="otp-step"
                  onSubmit={verifyOtp}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-center">
                      Enter 6-digit Code
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-gray-500">
                        <Lock size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-4 text-center tracking-[0.3em] text-lg font-bold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || otp.length !== 6} 
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <LogIn size={15} />
                        Verify &amp; Continue
                      </span>
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setStep("phone")} 
                    className="w-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-1.5 pt-1"
                  >
                    <ArrowLeft size={13} />
                    Change Phone Number
                  </button>
                </motion.form>
              )}

              {step === "name" && (
                <motion.form
                  key="name-step"
                  onSubmit={saveGuestName}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="text-center pb-1">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      Verification successful!
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Enter your name to complete setup.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-gray-500">
                        <Sparkles size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Verma"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        required
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !guestName.trim()} 
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving Profile...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <LogIn size={15} />
                        Complete Setup &amp; Enter
                      </span>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Social divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs font-semibold">
              <span className="bg-white dark:bg-gray-900 px-3 text-gray-400 dark:text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Alternative sign-in options */}
          <div className="space-y-3">
            <div
              id="gsi-container"
              className="flex justify-center w-full min-h-[44px]"
            />
            
            {/* Demo Student Fast Track */}
            <button
              type="button"
              onClick={handleDemoStudentLogin}
              className="w-full py-2.5 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <UserCheck size={15} className="text-blue-600 dark:text-blue-400" />
              Continue as Student (Demo Preview)
            </button>
          </div>
        </motion.div>
      </div>

      {/* Same footer used in AppLayout */}
      <footer className="w-full bg-white dark:bg-gray-900 border-t border-gray-150 dark:border-gray-800 px-6 py-10 bg-gradient-to-b from-transparent to-gray-50/40 dark:to-gray-950/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and Info */}
          <div className="space-y-3 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-transparent">
                <img src="/favicon.svg" alt="IIML Connect Logo" className="h-8 w-8 object-contain" />
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
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Map</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/" className="flex items-center gap-1.5 hover:text-brand dark:hover:text-brand-light transition-colors">
                  <Home size={14} /> Dashboard
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="flex items-center gap-1.5 hover:text-brand dark:hover:text-brand-light transition-colors">
                  <ShoppingBag size={14} /> Marketplace
                </Link>
              </li>
              <li>
                <Link href="/lost-found" className="flex items-center gap-1.5 hover:text-brand dark:hover:text-brand-light transition-colors">
                  <Search size={14} /> Lost &amp; Found
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Tech Column */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Support &amp; SLA</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-600 dark:text-gray-400">
              <li>
                <a href="mailto:support@iiml.ac.in" className="flex items-center gap-1.5 hover:text-brand dark:hover:text-brand-light transition-colors">
                  <Mail size={14} /> Helpdesk Email
                </a>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-550">
                  <FileText size={14} /> Version 1.4.2
                </span>
              </li>
              <li>
                <span className="text-gray-450 dark:text-gray-550 text-[10px]">L-Campus Connect</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-semibold text-gray-400">
            &copy; {new Date().getFullYear()} IIM Lucknow Connect. All rights reserved.
          </p>
          <p className="text-[10px] font-bold text-gray-400">
            Built with ❤️ by Student Founders for the IIML Ecosystem
          </p>
        </div>
      </footer>
    </div>
  );
}
