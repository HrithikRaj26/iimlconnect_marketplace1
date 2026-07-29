import { ItemCategory, ItemCondition, PickupLocationType } from "@/types";

export const MAX_IMAGES = 5;
export const MIN_IMAGES = 1;
export const DESCRIPTION_MAX_LENGTH = 500;
export const TITLE_MAX_LENGTH = 80;
export const MAX_TAGS = 6;

export const CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = [
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "furniture", label: "Furniture" },
  { value: "cycles", label: "Cycles" },
  { value: "hostel_essentials", label: "Hostel Essentials" },
  { value: "appliances", label: "Appliances" },
  { value: "others", label: "Others" },
];

export const CONDITION_OPTIONS: {
  value: ItemCondition;
  label: string;
  helperText: string;
}[] = [
  { value: "new", label: "New", helperText: "Never used with tag" },
  { value: "like_new", label: "Like New", helperText: "Minimal wear, mint" },
  { value: "good", label: "Good", helperText: "Fully functional, scuffs" },
  { value: "fair", label: "Fair", helperText: "Visible wear, usable" },
];

export const PICKUP_LOCATION_OPTIONS: {
  value: PickupLocationType;
  label: string;
  helperText: string;
}[] = [
  {
    value: "hostel_room",
    label: "Hostel Room / Block",
    helperText: "Best for heavy furniture or appliances (Hostel 15)",
  },
  {
    value: "academic_block",
    label: "Academic Block (Bodhi Griha)",
    helperText: "Good for books or electronic handovers during class hours",
  },
  {
    value: "library",
    label: "Gyanodaya Library",
    helperText: "Quiet central spot ideal for quick inspects",
  },
  {
    value: "custom",
    label: "Other / Custom Spot",
    helperText: "Specify any custom landmark inside campus",
  },
];

export const LISTING_TIPS = [
  "Mention reasons for selling (e.g., graduated, moving to double room).",
  "List any accessories included (locks, lights, chargers).",
  "Be transparent about cosmetic issues like scratches.",
  "Add relevant keywords like 'hostel delivery' to attract quick views.",
];
