"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

export default function ProfileBuilder() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [batch, setBatch] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const metadata = session.user.user_metadata || {};
          setFirstName(metadata.first_name || metadata.full_name?.split(" ")[0] || "");
          setLastName(metadata.last_name || metadata.full_name?.split(" ").slice(1).join(" ") || "");
          setBatch(metadata.batch || "");
          setBio(metadata.bio || "");
        }
      } catch (e) {
        console.error("Error loading user profile:", e);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!firstName.trim()) {
      setMessage({ type: "error", text: "First name is required." });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          batch: batch,
          bio: bio.trim(),
        },
      });

      if (error) throw error;
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Profile</h1>
          <p className="mt-2 text-sm text-gray-500">Manage your academic and contact details.</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {message && (
            <div
              className={`rounded-xl p-4 text-xs font-bold border ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border-green-150"
                  : "bg-red-50 text-red-700 border-red-150"
              }`}
            >
              {message.type === "success" ? "✓" : "⚠️"} {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <TextInput
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <TextInput
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand outline-none font-medium"
            >
              <option value="">Select your batch...</option>
              <option value="PGP 1">PGP 1</option>
              <option value="PGP 2">PGP 2</option>
              <option value="ABM 1">ABM 1</option>
              <option value="ABM 2">ABM 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand min-h-[120px] outline-none font-medium"
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" loading={loading}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
