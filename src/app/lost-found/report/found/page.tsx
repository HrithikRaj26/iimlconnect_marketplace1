"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TextArea } from "@/components/ui/TextArea";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { RadioCard } from "@/components/ui/RadioCard";
import { CategoryPicker } from "@/components/lost-found/CategoryPicker";
import { PhotoField } from "@/components/lost-found/PhotoField";
import { BackToLostFound } from "@/components/lost-found/BackToLostFound";
import { lostFoundService, uploadLostFoundPhoto } from "@/services/lostFoundService";
import { isSensitiveCategory, PGP_OFFICE_LOCATION } from "@/types/lostFound";

/** "Report Found" (Section 2.3). Photo is required (AC-2). */
export default function ReportFoundPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [locationChoice, setLocationChoice] = useState<"pgp" | "custom">("pgp");
  const [customLocation, setCustomLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sensitive = isSensitiveCategory(category);
  // Sensitive items are always PGP Office, regardless of what was picked
  // before the category made them sensitive — "custom" is unselectable.
  const effectiveLocationChoice = sensitive ? "pgp" : locationChoice;

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
    if (effectiveLocationChoice === "custom" && !customLocation.trim()) {
      setError("Enter a pickup location, or choose PGP Office.");
      return;
    }
    setSubmitting(true);
    try {
      const photoUrl = await uploadLostFoundPhoto(photo, "found", sensitive);
      const created = await lostFoundService.createFoundReport({
        category,
        description,
        photoUrl,
        pickupLocation: effectiveLocationChoice === "pgp" ? PGP_OFFICE_LOCATION : customLocation.trim(),
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">Pickup location</label>
            <div className="space-y-2">
              <RadioCard
                selected={effectiveLocationChoice === "pgp"}
                onSelect={() => setLocationChoice("pgp")}
                label={PGP_OFFICE_LOCATION}
                helperText="Central drop-off point."
              />
              <div className={sensitive ? "pointer-events-none opacity-40" : undefined}>
                <RadioCard
                  selected={effectiveLocationChoice === "custom"}
                  onSelect={() => !sensitive && setLocationChoice("custom")}
                  label="Custom location"
                  helperText="Choose a specific spot to hand the item off."
                />
              </div>
            </div>
            {effectiveLocationChoice === "custom" && (
              <TextInput
                className="mt-2"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="e.g. Hostel 4 warden's office"
              />
            )}
            {sensitive && (
              <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                You have found a sensitive item. Sensitive items can only be deposited at PGP office
              </p>
            )}
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <Button size="lg" fullWidth loading={submitting} onClick={submit}>
            Submit found report
          </Button>
        </div>
      </div>
    </div>
  );
}
