"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, Sparkles, LogIn, ArrowLeft } from "lucide-react";

export default function LoginView({ onLogin }: { onLogin: (session: any) => void }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: "115760004033-6o92pdosobhjkhe1gjs54ls93oqa5rfb.apps.googleusercontent.com",
        callback: handleGoogleLogin,
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById("gsi-container"),
        { theme: "outline", size: "large", type: "standard", width: "100%" }
      );
    }
  }, []);

  const handleGoogleLogin = async (response: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential
      });
      if (error) throw error;
      onLogin(data.session);
    } catch (e: any) {
      alert("Error with Google Sign-In: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (phone.length < 10) {
      alert("Please enter a valid phone number (e.g. +91...).");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) {
      alert('Error sending OTP: ' + error.message);
    } else {
      setStep("otp");
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    setLoading(false);
    if (error) {
      alert('Invalid OTP: ' + error.message);
    } else {
      onLogin(data.session);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12 overflow-hidden transition-colors duration-300">
      {/* Premium Decorative Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 -z-10 w-72 md:w-96 h-72 md:h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/4 -z-10 w-72 md:w-96 h-72 md:h-96 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />

      {/* Main Glassmorphic Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
      >
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/15 mb-4">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-gray-100">
            IIML <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Connect</span>
          </h2>
          <p className="mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            Campus Marketplace & Venture Hub
          </p>
        </div>

        {/* Dynamic Form Slider with AnimatePresence */}
        <div className="relative overflow-hidden min-h-[170px]">
          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 pl-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-gray-600">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50 py-2.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all text-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>

                <button 
                  onClick={sendOtp} 
                  disabled={loading || !phone} 
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <LogIn size={14} />
                      Send Verification OTP
                    </span>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="otp-step"
                onSubmit={verifyOtp}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 pl-1">
                    Enter 6-digit OTP
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-gray-600">
                      <Lock size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="block w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50 py-2.5 pl-10 pr-4 text-center tracking-[0.3em] text-lg font-black outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all text-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || otp.length !== 6} 
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <LogIn size={14} />
                      Verify & Sign In
                    </span>
                  )}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setStep("phone")} 
                  className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={12} />
                  Change Phone Number
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Social divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-150 dark:border-gray-800" />
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-wider">
            <span className="bg-white dark:bg-gray-900 px-3 text-gray-400 dark:text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In Container wrapper */}
        <div 
          id="gsi-container" 
          className="flex justify-center w-full min-h-[44px] rounded-xl overflow-hidden hover:brightness-105 transition-all shadow-sm border border-gray-100 dark:border-gray-800"
        />
      </motion.div>
    </div>
  );
}
