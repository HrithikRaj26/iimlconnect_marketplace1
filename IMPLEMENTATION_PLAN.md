# Feature 1 — Easy Item Listing with Photos: Implementation Plan

## 1. Screens Detected
1. **Upload Photos** (Step 1/4) — dropzone + reorderable selected-photos list, cover photo badge
2. **Item Details** (Step 2/4) — title, description, category, condition, tags + live preview + tips
3. **Pricing & Logistics** (Step 3/4) — price, negotiation toggle, pickup location radio cards + live preview
4. **Preview & Publish** (Step 4/4) — full listing preview, seller info, Publish action
5. **Success** — confirmation screen with next-action buttons

## 2. Components Detected & Built
- `TopNav`, `Stepper` — shared chrome across all 4 steps
- `Button`, `TextInput`, `TextArea`, `Toggle`, `RadioCard`, `Chip` — generic reusable primitives
- `ImageDropzone`, `SelectedPhotoItem`, `ImageUploader` — Step 1 photo upload + drag-reorder
- `CategorySelect`, `ConditionSelector`, `TagInput`, `TipsPanel` — Step 2 fields
- `PreviewCard` (compact/full variants) — reused across Steps 2, 3, and 4
- `ListingWizardShell` — shared layout (nav + stepper + sticky footer actions)

## 3. Navigation Flow
```
/  (Marketplace placeholder)
 └─ "+ Sell an Item" → /listing/create
      Step 1 → Step 2 → Step 3 → Step 4 → /listing/create/success
      (Back buttons return to the previous step; state persists via React Context)
      Success → "Create Another Listing" resets draft → Step 1
      Success → "Return to Marketplace Dashboard" → /
```
State lives in `ListingDraftProvider` (React Context + `useReducer`), scoped to the
`/listing/create` route segment via `layout.tsx`, so it persists across the four
steps but resets automatically when the user leaves the flow.

## 4. Data Model
See `src/types/index.ts` for the full model. Core shape:
```ts
ListingDraft {
  images: ListingImage[]       // client-side upload lifecycle per image
  title, description
  category: ItemCategory | null
  condition: ItemCondition | null
  tags: string[]
  price: string
  negotiable: boolean
  pickupLocationType: PickupLocationType | null
  customPickupNote: string
}
```
`listingService.ts` defines an `IListingService` interface with a mock
implementation (`uploadImage`, `publishListing`) — swap the class body for real
`fetch` calls once the backend is ready; no screen code needs to change.

## 5. Validation Implemented
- At least one photo required (Step 1)
- Title required, ≤ 80 characters (Step 2)
- Category required (Step 2)
- Condition required (Step 2)
- Description ≤ 500 characters (Step 2)
- Price required, must be a positive number (Step 3)
- Pickup location required (Step 3)
- Image upload failures surface a per-image retry action, and the wizard blocks
  "Next" while any image is still mid-upload

## 6. States Handled
- **Loading:** per-image upload spinner; full-screen "Publishing…" button state
- **Error:** per-field validation errors; per-image upload failure + retry;
  publish-failure banner
- **Empty:** "no photos yet" placeholder in the selected-photos panel
- **Success:** dedicated confirmation screen with next actions
