"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TextInput } from "@/components/ui/TextInput";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioCard } from "@/components/ui/RadioCard";
import { CategoryPicker } from "@/components/lost-found/CategoryPicker";
import { BackToLostFound } from "@/components/lost-found/BackToLostFound";
import { lostFoundService, ApiError } from "@/services/lostFoundService";
import { useToast } from "@/context/ToastContext";
import { Loader } from "@/components/ui/Loader";
import { isSensitiveCategory, PGP_OFFICE_LOCATION } from "@/types/lostFound";

interface Detail {
  id: string;
  type: "lost" | "found";
  category: string;
  description: string;
  last_seen_location?: string;
  lost_date?: string;
  visible_to_public?: boolean;
  pickup_location?: string;
  found_location?: string;
}

/** Edit an existing lost/found report — "My Reports" edit action. Photo isn't editable here; only text fields. */
export default function EditReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { confirmAction } = useToast();

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [lostDate, setLostDate] = useState("");
  const [showToPublic, setShowToPublic] = useState(true);
  const [locationChoice, setLocationChoice] = useState<"pgp" | "custom">("pgp");
  const [customLocation, setCustomLocation] = useState("");
  const [foundLocation, setFoundLocation] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await lostFoundService.getById(params.id)) as unknown as Detail;
      setReport(data);
      setCategory(data.category);
      setDescription(data.description);
      if (data.type === "lost") {
        setLastSeenLocation(data.last_seen_location ?? "");
        setLostDate(data.lost_date ?? "");
        setShowToPublic(data.visible_to_public ?? true);
      } else {
        const isPgp = data.pickup_location === PGP_OFFICE_LOCATION;
        setLocationChoice(isPgp ? "pgp" : "custom");
        setCustomLocation(isPgp ? "" : data.pickup_location ?? "");
        setFoundLocation(data.found_location ?? "");
      }
    } catch (e: any) {
      setError(e.message ?? "Could not load report");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader fullscreen message="Loading report details..." />;
  if (error && !report) return <div className="p-10 text-center text-sm font-medium text-red-500">{error}</div>;
  if (!report) return null;

  const sensitive = isSensitiveCategory(category);
  const effectiveLocationChoice = sensitive ? "pgp" : locationChoice;

  const save = async () => {
    setError(null);
    if (!category || !description) {
      setError("Category and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      if (report.type === "lost") {
        if (!lastSeenLocation || !lostDate) {
          setError("Last-seen location and date are required.");
          setSubmitting(false);
          return;
        }
        await lostFoundService.updateReport(report.id, {
          category,
          description,
          lastSeenLocation,
          lostDate,
          visibleToPublic: showToPublic,
        });
      } else {
        if (!foundLocation.trim()) {
          setError("Where you found the item is required.");
          setSubmitting(false);
          return;
        }
        if (effectiveLocationChoice === "custom" && !customLocation.trim()) {
          setError("Enter a pickup location, or choose PGP Office.");
          setSubmitting(false);
          return;
        }
        await lostFoundService.updateReport(report.id, {
          category,
          description,
          foundLocation: foundLocation.trim(),
          pickupLocation: effectiveLocationChoice === "pgp" ? PGP_OFFICE_LOCATION : customLocation.trim(),
        });
      }
      router.push(`/lost-found/${report.id}`);
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : "Could not save changes");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    confirmAction(
      "Delete this report? This can't be undone.",
      async () => {
        setSubmitting(true);
        setError(null);
        try {
          await lostFoundService.deleteReport(report.id);
          router.push("/lost-found");
        } catch (e: any) {
          setError(e instanceof ApiError ? e.message : "Could not delete report");
        } finally {
          setSubmitting(false);
        }
      },
      "Delete Report",
      "danger"
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <BackToLostFound />
        <h1 className="mb-6 text-xl font-bold text-gray-900">Edit {report.type} report</h1>

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
            rows={4}
          />

          {report.type === "lost" ? (
            <>
              <TextInput
                label="Last-seen location"
                required
                value={lastSeenLocation}
                onChange={(e) => setLastSeenLocation(e.target.value)}
              />
              <TextInput
                label="Date lost"
                required
                type="date"
                value={lostDate}
                onChange={(e) => setLostDate(e.target.value)}
              />
              <div>
                <Checkbox checked={showToPublic} onChange={setShowToPublic} label="Show to public" />
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <TextInput
                label="Where did you find this item?"
                required
                value={foundLocation}
                onChange={(e) => setFoundLocation(e.target.value)}
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
            </div>
          )}

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button size="lg" fullWidth loading={submitting} onClick={save}>
              Save changes
            </Button>
            <Button size="lg" variant="secondary" loading={submitting} onClick={remove}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
