"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TextArea } from "@/components/ui/TextArea";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { RadioCard } from "@/components/ui/RadioCard";
import { CategoryPicker } from "@/components/lost-found/CategoryPicker";
import { PhotoField } from "@/components/lost-found/PhotoField";
import { BackToLostFound } from "@/components/lost-found/BackToLostFound";
import { lostFoundService, uploadLostFoundPhoto } from "@/services/lostFoundService";
import { isSensitiveCategory, PGP_OFFICE_LOCATION } from "@/types/lostFound";

/** Reads a prefill query param without useSearchParams(), so this page doesn't need a Suspense boundary to stay statically prerenderable. */
function prefillParam(key: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

/** "Report Found" (Section 2.3). Photo is required (AC-2). Category/description/location can arrive prefilled from a lost report's "I Found This Item" button. */
export default function ReportFoundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = searchParams.get("prefill") || "";
  const [category, setCategory] = useState(() => prefillParam("category"));
  const [description, setDescription] = useState(() => prefillParam("description") || prefill);
  const [foundLocation, setFoundLocation] = useState(() => prefillParam("location"));
  const [photo, setPhoto] = useState<File | null>(null);
  const [locationChoice, setLocationChoice] = useState<"pgp" | "custom">("pgp");
  const [customLocation, setCustomLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wasPrefilled] = useState(() => !!prefillParam("category"));

  const sensitive = isSensitiveCategory(category);
  // Sensitive items are always PGP Office, regardless of what was picked
  // before the category made them sensitive — "custom" is unselectable.
  const effectiveLocationChoice = sensitive ? "pgp" : locationChoice;

  const submit = async () => {
    setError(null);
    if (!category || !description || !foundLocation) {
      setError("Category, description, and found location are required.");
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
        foundLocation,
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

        {wasPrefilled && (
          <p className="mb-4 rounded-lg bg-brand-light p-3 text-sm text-brand-dark">
            Pre-filled from a lost report — double-check the details match what you actually found before submitting.
          </p>
        )}

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

          <TextInput
            label="Where did you find this item?"
            required
            value={foundLocation}
            onChange={(e) => setFoundLocation(e.target.value)}
            placeholder="e.g. Academic Block 1, Room 204"
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">Pickup location</label>
            <p className="mb-2 text-xs text-gray-500">Where the owner can collect it from — may be different from where you found it.</p>
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
