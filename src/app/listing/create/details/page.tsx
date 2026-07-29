"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ListingWizardShell } from "@/components/listing/ListingWizardShell";
import { TextInput } from "@/components/ui/TextInput";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { CategorySelect } from "@/components/listing/CategorySelect";
import { ConditionSelector } from "@/components/listing/ConditionSelector";
import { TagInput } from "@/components/listing/TagInput";
import { TipsPanel } from "@/components/listing/TipsPanel";
import { PreviewCard } from "@/components/listing/PreviewCard";
import { useListingDraft } from "@/hooks/useListingDraft";
import { validateDetailsStep, hasErrors } from "@/utils/validation";
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from "@/constants/listing";
import { FieldErrors } from "@/types";

export default function ItemDetailsStep() {
  const router = useRouter();
  const {
    draft,
    setTitle,
    setDescription,
    setCategory,
    setCondition,
    setTags,
  } = useListingDraft();
  const [errors, setErrors] = useState<FieldErrors>({});

  const goNext = () => {
    const nextErrors = validateDetailsStep(draft);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    router.push("/listing/create/pricing");
  };

  return (
    <ListingWizardShell
      currentStep={2}
      footer={
        <>
          <Button variant="secondary" onClick={() => router.push("/listing/create")}>
            Back
          </Button>
          <Button onClick={goNext}>Next: Pricing</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900">Item Details</h2>

          <TextInput
            label="Item Title"
            required
            placeholder="e.g. Decathlon Rockrider ST100 (Blue, Medium)"
            value={draft.title}
            maxLength={TITLE_MAX_LENGTH}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
          />

          <TextArea
            label="Description"
            required
            placeholder="Describe the item's features, accessories included, and reason for selling."
            value={draft.description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={5}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
          />

          <CategorySelect
            value={draft.category}
            onChange={setCategory}
            error={errors.category}
          />

          <ConditionSelector
            value={draft.condition}
            onChange={setCondition}
            error={errors.condition}
          />

          <TagInput tags={draft.tags} onChange={setTags} />
        </div>

        <div className="space-y-6">
          <TipsPanel />
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Live Preview</p>
            <PreviewCard draft={draft} />
          </div>
        </div>
      </div>
    </ListingWizardShell>
  );
}
