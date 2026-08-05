"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TextArea } from "@/components/ui/TextArea";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CategoryPicker } from "@/components/lost-found/CategoryPicker";
import { PhotoField } from "@/components/lost-found/PhotoField";
import { BackToLostFound } from "@/components/lost-found/BackToLostFound";
import { lostFoundService, uploadLostFoundPhoto } from "@/services/lostFoundService";
import { suggestTierForCategory } from "@/types/lostFound";

/** "Report Found" (Section 2.3). Photo is required (AC-2). */
export default function ReportFoundPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [contentsWithheld, setContentsWithheld] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (!category || !description) {
      setError("Category and description are required.");
      return;
    }
    if (!photo) {
      setError("A photo is required for found reports.");
      return;
    }
    setSubmitting(true);
    try {
      const photoUrl = await uploadLostFoundPhoto(photo, "found", suggestTierForCategory(category));
      const created = await lostFoundService.createFoundReport({
        category,
        description,
        photoUrl,
        contentsWithheld,
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
        <h1 className="mb-6 text-xl font-bold text-gray-900">Report a found item</h1>

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
            placeholder="Blue steel bottle, dent, found near..."
            rows={4}
          />

          <PhotoField file={photo} onChange={setPhoto} label="Photo (required)" />

          <Checkbox
            checked={contentsWithheld}
            onChange={setContentsWithheld}
            label="Withhold contents from public photo"
          />

          <TextInput label="Pickup location" value="Central Lost & Found Room" disabled />

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <Button size="lg" fullWidth loading={submitting} onClick={submit}>
            Submit found report
          </Button>
        </div>
      </div>
    </div>
  );
}
