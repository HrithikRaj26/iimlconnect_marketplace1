"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            IIML <span className="text-brand">Connect</span>
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the campus ecosystem
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {step === "phone" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <TextInput
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button 
                onClick={sendOtp} 
                disabled={loading} 
                className="w-full justify-center"
                size="lg"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </div>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 6-digit OTP
                </label>
                <TextInput
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center tracking-widest text-lg"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading || otp.length !== 6} 
                className="w-full justify-center"
                size="lg"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </Button>
              <button 
                type="button" 
                onClick={() => setStep("phone")} 
                className="w-full text-sm text-gray-500 hover:text-gray-900 mt-2"
              >
                Back
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div id="gsi-container" className="flex justify-center w-full min-h-[40px]"></div>
        </div>
      </div>
    </div>
  );
}
