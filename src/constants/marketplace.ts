import { MarketplaceFilters, PickupFilter, SortOption } from "@/types";
import { ItemCategory, ItemCondition } from "@/types";

export const PRICE_FLOOR = 0;
export const PRICE_CEILING = 50000;
export const PAGE_SIZE = 6;

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevant", label: "Most Relevant" },
  { value: "newest", label: "Newest First" },
  { value: "price_low_high", label: "Price: Low to High" },
  { value: "price_high_low", label: "Price: High to Low" },
];

export const FILTER_CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = [
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "furniture", label: "Furniture" },
  { value: "cycles", label: "Cycles" },
  { value: "hostel_essentials", label: "Hostel Essentials" },
  { value: "appliances", label: "Appliances" },
  { value: "others", label: "Others" },
];

export const FILTER_CONDITION_OPTIONS: {
  value: ItemCondition;
  label: string;
  dotColor: string;
}[] = [
  { value: "new", label: "New", dotColor: "#16A34A" },
  { value: "like_new", label: "Like New", dotColor: "#2563EB" },
  { value: "good", label: "Good", dotColor: "#F59E0B" },
  { value: "fair", label: "Fair", dotColor: "#EF4444" },
];

export const FILTER_PICKUP_OPTIONS: { value: PickupFilter; label: string }[] = [
  { value: "hostel", label: "Hostel" },
  { value: "academic_block", label: "Academic Block" },
  { value: "library", label: "Library" },
  { value: "other", label: "Other" },
];

export const DEFAULT_FILTERS: MarketplaceFilters = {
  query: "",
  categories: [],
  conditions: [],
  pickups: [],
  minPrice: PRICE_FLOOR,
  maxPrice: PRICE_CEILING,
  sort: "relevant",
};
