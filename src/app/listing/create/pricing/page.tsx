"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ListingWizardShell } from "@/components/listing/ListingWizardShell";
import { TextInput } from "@/components/ui/TextInput";
import { Toggle } from "@/components/ui/Toggle";
import { RadioCard } from "@/components/ui/RadioCard";
import { Button } from "@/components/ui/Button";
import { PreviewCard } from "@/components/listing/PreviewCard";
import { useListingDraft } from "@/hooks/useListingDraft";
import { validatePricingStep, hasErrors } from "@/utils/validation";
import { PICKUP_LOCATION_OPTIONS } from "@/constants/listing";
import { FieldErrors } from "@/types";

export default function PricingStep() {
  const router = useRouter();
  const {
    draft,
    setPrice,
    setNegotiable,
    setPickupLocationType,
    setCustomPickupNote,
  } = useListingDraft();
  const [errors, setErrors] = useState<FieldErrors>({});

  const goNext = () => {
    const nextErrors = validatePricingStep(draft);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    router.push("/listing/create/preview");
  };

  return (
    <ListingWizardShell
      currentStep={3}
      footer={
        <>
          <Button variant="secondary" onClick={() => router.push("/listing/create/details")}>
            Back
          </Button>
          <Button onClick={goNext}>Next: Preview &amp; Publish</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900">Pricing &amp; Logistics</h2>

          <TextInput
            label="Your Selling Price"
            required
            type="number"
            min={0}
            prefix="₹"
            placeholder="0"
            value={draft.price}
            onChange={(e) => setPrice(e.target.value)}
            error={errors.price}
          />

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <Toggle
              checked={draft.negotiable}
              onChange={setNegotiable}
              label="Allow Negotiation / Offers"
              description="Buyers can send counter-offers. Recommended for quicker sales."
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-gray-800">
              Preferred Pickup Location<span className="ml-0.5 text-red-500">*</span>
            </p>
            <p className="mb-3 text-xs text-gray-500">
              Choose a convenient spot within the IIM Lucknow campus.
            </p>
            <div className="space-y-3">
              {PICKUP_LOCATION_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  label={opt.label}
                  helperText={opt.helperText}
                  selected={draft.pickupLocationType === opt.value}
                  onSelect={() => setPickupLocationType(opt.value)}
                />
              ))}
            </div>
            {errors.pickupLocationType && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-500">
                {errors.pickupLocationType}
              </p>
            )}

            {draft.pickupLocationType === "custom" && (
              <div className="mt-3">
                <TextInput
                  label="Custom pickup note"
                  placeholder="e.g. Main gate of Hostel 15, evenings only"
                  value={draft.customPickupNote}
                  onChange={(e) => setCustomPickupNote(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-600">Live Preview</p>
          <PreviewCard draft={draft} />
        </div>
      </div>
    </ListingWizardShell>
  );
}
