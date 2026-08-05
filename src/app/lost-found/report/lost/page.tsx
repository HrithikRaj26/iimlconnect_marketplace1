"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TextInput } from "@/components/ui/TextInput";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { CategoryPicker } from "@/components/lost-found/CategoryPicker";
import { PhotoField } from "@/components/lost-found/PhotoField";
import { BackToLostFound } from "@/components/lost-found/BackToLostFound";
import { lostFoundService, uploadLostFoundPhoto } from "@/services/lostFoundService";
import { suggestTierForCategory } from "@/types/lostFound";

/**
 * "Report Lost" (Section 2.3 of the original PRD). Photo optional (AC-1) —
 * losers-without-photos is a first-class path. "Campus-map location
 * picker" stays a free-text field, same simplification as the original
 * React Native build (schema stores location as text, not lat/lng).
 */
export default function ReportLostPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [lostDate, setLostDate] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (!category || !description || !lastSeenLocation || !lostDate) {
      setError("Category, description, last-seen location, and date are required.");
      return;
    }
    setSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photo) {
        photoUrl = await uploadLostFoundPhoto(photo, "lost", suggestTierForCategory(category));
      }
      const created = await lostFoundService.createLostReport({
        category,
        description,
        lastSeenLocation,
        lostDate,
        photoUrl,
      });
      router.push(`/lost-found/${created.id}`);
    } catch (e: any) {
      setError(e.message ?? "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <BackToLostFound />
        <h1 className="mb-6 text-xl font-bold text-gray-900">Report a lost item</h1>

        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">Category</label>
            <CategoryPicker value={category} onChange={setCategory} />
          </div>

          <TextArea
            label="Description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Steel blue bottle, dent near the cap..."
            rows={4}
          />
          <TextInput
            label="Last-seen location"
            required
            value={lastSeenLocation}
            onChange={(e) => setLastSeenLocation(e.target.value)}
            placeholder="Academic Block 1, Room 204"
          />
          <TextInput
            label="Date lost"
            required
            type="date"
            value={lostDate}
            onChange={(e) => setLostDate(e.target.value)}
          />

          <PhotoField file={photo} onChange={setPhoto} label="Photo (optional)" />

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <Button size="lg" fullWidth loading={submitting} onClick={submit}>
            Submit lost report
          </Button>
        </div>
      </div>
    </div>
  );
}
