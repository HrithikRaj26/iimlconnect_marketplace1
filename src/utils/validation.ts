import {
  DESCRIPTION_MAX_LENGTH,
  MIN_IMAGES,
  TITLE_MAX_LENGTH,
} from "@/constants/listing";
import { FieldErrors, ListingDraft } from "@/types";

/** Validates only what Step 1 (Upload Photos) is responsible for. */
export function validatePhotosStep(draft: ListingDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (draft.images.length < MIN_IMAGES) {
    errors.images = "Please add at least one photo of your item.";
  }
  return errors;
}

/** Validates only what Step 2 (Item Details) is responsible for. */
export function validateDetailsStep(draft: ListingDraft): FieldErrors {
  const errors: FieldErrors = {};

  const title = draft.title.trim();
  if (!title) {
    errors.title = "Item title is required.";
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be under ${TITLE_MAX_LENGTH} characters.`;
  }

  if (!draft.category) {
    errors.category = "Please select a category.";
  }

  if (!draft.condition) {
    errors.condition = "Please select the item's condition.";
  }

  if (draft.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be under ${DESCRIPTION_MAX_LENGTH} characters.`;
  }

  return errors;
}

/** Validates only what Step 3 (Pricing & Logistics) is responsible for. */
export function validatePricingStep(draft: ListingDraft): FieldErrors {
  const errors: FieldErrors = {};

  const priceNum = Number(draft.price);
  if (!draft.price.trim()) {
    errors.price = "Please enter a selling price.";
  } else if (Number.isNaN(priceNum) || priceNum <= 0) {
    errors.price = "Price must be a positive number.";
  }

  if (!draft.pickupLocationType) {
    errors.pickupLocationType = "Please choose a preferred pickup location.";
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
