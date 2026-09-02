"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { TextArea } from "@/components/ui/TextArea";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";

export default function ProfileBuilder() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [batch, setBatch] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [mobile, setMobile] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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
          setAvatarUrl(metadata.custom_avatar || metadata.avatar_url || "");
          setMobile(metadata.mobile || metadata.phone || "");

          const userIsGuest = metadata.is_guest || !session.user.email || !!session.user.phone;
          setIsGuest(userIsGuest);
          if (userIsGuest && !metadata.batch) {
            setBatch("External Guest");
          }
        }
      } catch (e) {
        console.error("Error loading user profile:", e);
      }
    };

    fetchUserProfile();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size should be less than 3MB." });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error } = await supabase.storage
        .from("marketplace-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("marketplace-images")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setMessage({ type: "success", text: "Photo uploaded successfully! Click Save Profile to apply changes." });
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setMessage({ type: "error", text: err.message || "Failed to upload photo." });
    } finally {
      setUploading(false);
    }
  };

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
      const { data: { session } } = await supabase.auth.getSession();
      const currentMetadata = session?.user?.user_metadata || {};
      const { data, error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          batch: batch,
          bio: bio.trim(),
          avatar_url: avatarUrl,
          custom_avatar: avatarUrl,
          mobile: mobile.trim(),
          is_guest: currentMetadata.is_guest || isGuest
        },
      });

      if (error) throw error;
      
      setMessage({ type: "success", text: "Profile updated successfully! Redirecting..." });
      
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isGuest ? "Manage your contact and basic profile details." : "Manage your academic and contact details."}
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {(firstName === "" || firstName === "Student" || firstName === "Guest") && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-105 dark:border-amber-900/30 p-4 text-xs font-bold text-amber-800 dark:text-amber-400">
              ⚠️ Please set your actual First Name and Last Name below to complete your registration details.
            </div>
          )}

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

          {/* Profile Photo selection */}
          <div className="space-y-3 pb-4 border-b border-gray-100">
            <label className="block text-sm font-semibold text-gray-700">Choose Profile Picture</label>
            <div className="flex flex-wrap items-center gap-6">
              {/* Selected avatar preview */}
              <div className="h-16 w-16 rounded-full overflow-hidden border bg-gray-50 flex items-center justify-center text-lg font-bold text-gray-400">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                  <span>{firstName ? firstName[0].toUpperCase() : "?"}</span>
                )}
              </div>

              {/* Upload button wrapper */}
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  id="avatar-file-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("avatar-file-input")?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 transition-colors shadow-2xs"
                >
                  {uploading ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={14} className="text-gray-500 dark:text-gray-400" />
                      <span>Upload Custom Photo</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Preset selectors divider */}
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              {/* Preset selectors */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
                  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
                  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack",
                  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha",
                  "https://api.dicebear.com/7.x/adventurer/svg?seed=Toby",
                  "https://api.dicebear.com/7.x/adventurer/svg?seed=Cody",
                ].map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAvatarUrl(preset)}
                    className={`h-11 w-11 rounded-full overflow-hidden border-2 bg-gray-50 dark:bg-gray-800 transition-colors ${
                      avatarUrl === preset ? "border-blue-600 ring-2 ring-blue-500/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <img src={preset} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Option */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Or paste a custom hosted image URL:</label>
              <TextInput
                type="url"
                placeholder="https://example.com/my-photo.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label="First Name"
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <TextInput
              label="Last Name"
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label="Mobile Number"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Batch</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                disabled={isGuest}
                className="appearance-none w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-3.5 pr-10 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-colors disabled:opacity-75 disabled:bg-gray-50 dark:disabled:bg-gray-800 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%25234b5563%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-[size:1.1rem_1.1rem] bg-no-repeat"
              >
                {isGuest ? (
                  <option value="External Guest">External Guest</option>
                ) : (
                  <>
                    <option value="">Select your batch...</option>
                    <option value="PGP 1">PGP 1</option>
                    <option value="PGP 2">PGP 2</option>
                    <option value="ABM 1">ABM 1</option>
                    <option value="ABM 2">ABM 2</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <TextArea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={300}
            placeholder="Tell us about yourself, your interests, or your programme..."
          />

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
