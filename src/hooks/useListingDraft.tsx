"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import {
  ItemCategory,
  ItemCondition,
  ListingDraft,
  ListingImage,
  PickupLocationType,
  PublishedListing,
} from "@/types";

const initialDraft: ListingDraft = {
  images: [],
  title: "",
  description: "",
  category: null,
  condition: null,
  tags: [],
  price: "",
  negotiable: true,
  pickupLocationType: null,
  customPickupNote: "",
};

type Action =
  | { type: "ADD_IMAGES"; images: ListingImage[] }
  | { type: "REMOVE_IMAGE"; id: string }
  | { type: "REORDER_IMAGES"; images: ListingImage[] }
  | { type: "SET_IMAGE_STATUS"; id: string; status: ListingImage["status"]; remoteUrl?: string; errorMessage?: string }
  | { type: "SET_TITLE"; value: string }
  | { type: "SET_DESCRIPTION"; value: string }
  | { type: "SET_CATEGORY"; value: ItemCategory }
  | { type: "SET_CONDITION"; value: ItemCondition }
  | { type: "SET_TAGS"; value: string[] }
  | { type: "SET_PRICE"; value: string }
  | { type: "SET_NEGOTIABLE"; value: boolean }
  | { type: "SET_PICKUP_TYPE"; value: PickupLocationType }
  | { type: "SET_CUSTOM_PICKUP_NOTE"; value: string }
  | { type: "RESTORE_DRAFT"; draft: ListingDraft }
  | { type: "RESET" };

function reducer(state: ListingDraft, action: Action): ListingDraft {
  switch (action.type) {
    case "ADD_IMAGES":
      return { ...state, images: [...state.images, ...action.images] };
    case "REMOVE_IMAGE":
      return { ...state, images: state.images.filter((img) => img.id !== action.id) };
    case "REORDER_IMAGES":
      return { ...state, images: action.images };
    case "SET_IMAGE_STATUS":
      return {
        ...state,
        images: state.images.map((img) =>
          img.id === action.id
            ? { ...img, status: action.status, remoteUrl: action.remoteUrl ?? img.remoteUrl, errorMessage: action.errorMessage }
            : img
        ),
      };
    case "SET_TITLE":
      return { ...state, title: action.value };
    case "SET_DESCRIPTION":
      return { ...state, description: action.value };
    case "SET_CATEGORY":
      return { ...state, category: action.value };
    case "SET_CONDITION":
      return { ...state, condition: action.value };
    case "SET_TAGS":
      return { ...state, tags: action.value };
    case "SET_PRICE":
      return { ...state, price: action.value };
    case "SET_NEGOTIABLE":
      return { ...state, negotiable: action.value };
    case "SET_PICKUP_TYPE":
      return { ...state, pickupLocationType: action.value };
    case "SET_CUSTOM_PICKUP_NOTE":
      return { ...state, customPickupNote: action.value };
    case "RESTORE_DRAFT":
      return { ...action.draft };
    case "RESET":
      if (typeof window !== "undefined") {
        localStorage.removeItem("iiml-listing-draft");
      }
      return initialDraft;
    default:
      return state;
  }
}

interface ListingDraftContextValue {
  draft: ListingDraft;
  publishedListing: PublishedListing | null;
  setPublishedListing: (listing: PublishedListing) => void;
  addImages: (images: ListingImage[]) => void;
  removeImage: (id: string) => void;
  reorderImages: (images: ListingImage[]) => void;
  setImageStatus: (id: string, status: ListingImage["status"], remoteUrl?: string, errorMessage?: string) => void;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setCategory: (value: ItemCategory) => void;
  setCondition: (value: ItemCondition) => void;
  setTags: (value: string[]) => void;
  setPrice: (value: string) => void;
  setNegotiable: (value: boolean) => void;
  setPickupLocationType: (value: PickupLocationType) => void;
  setCustomPickupNote: (value: string) => void;
  reset: () => void;
}

const ListingDraftContext = createContext<ListingDraftContextValue | undefined>(
  undefined
);

export function ListingDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, initialDraft);
  const [publishedListing, setPublishedListingState] = React.useState<PublishedListing | null>(null);
  const setPublishedListing = useCallback((listing: PublishedListing) => setPublishedListingState(listing), []);

  // Restore draft on mount (avoids hydration mismatch)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("iiml-listing-draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.images) {
          parsed.images = parsed.images.map((img: any) => ({
            ...img,
            file: undefined, // File objects cannot be parsed back
          }));
        }
        dispatch({ type: "RESTORE_DRAFT", draft: parsed });
      }
    } catch (e) {
      console.error("Failed to restore draft:", e);
    }
  }, []);

  // Save draft to localStorage on changes
  React.useEffect(() => {
    try {
      const cleanDraft = {
        ...draft,
        images: draft.images.map((img) => ({
          id: img.id,
          previewUrl: img.previewUrl,
          remoteUrl: img.remoteUrl,
          status: img.status === "uploaded" ? ("uploaded" as const) : ("idle" as const),
          errorMessage: img.errorMessage,
        })),
      };
      localStorage.setItem("iiml-listing-draft", JSON.stringify(cleanDraft));
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
  }, [draft]);

  const addImages = useCallback((images: ListingImage[]) => dispatch({ type: "ADD_IMAGES", images }), []);
  const removeImage = useCallback((id: string) => dispatch({ type: "REMOVE_IMAGE", id }), []);
  const reorderImages = useCallback((images: ListingImage[]) => dispatch({ type: "REORDER_IMAGES", images }), []);
  const setImageStatus = useCallback(
    (id: string, status: ListingImage["status"], remoteUrl?: string, errorMessage?: string) =>
      dispatch({ type: "SET_IMAGE_STATUS", id, status, remoteUrl, errorMessage }),
    []
  );
  const setTitle = useCallback((value: string) => dispatch({ type: "SET_TITLE", value }), []);
  const setDescription = useCallback((value: string) => dispatch({ type: "SET_DESCRIPTION", value }), []);
  const setCategory = useCallback((value: ItemCategory) => dispatch({ type: "SET_CATEGORY", value }), []);
  const setCondition = useCallback((value: ItemCondition) => dispatch({ type: "SET_CONDITION", value }), []);
  const setTags = useCallback((value: string[]) => dispatch({ type: "SET_TAGS", value }), []);
  const setPrice = useCallback((value: string) => dispatch({ type: "SET_PRICE", value }), []);
  const setNegotiable = useCallback((value: boolean) => dispatch({ type: "SET_NEGOTIABLE", value }), []);
  const setPickupLocationType = useCallback((value: PickupLocationType) => dispatch({ type: "SET_PICKUP_TYPE", value }), []);
  const setCustomPickupNote = useCallback((value: string) => dispatch({ type: "SET_CUSTOM_PICKUP_NOTE", value }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const value = useMemo(
    () => ({
      draft,
      publishedListing,
      setPublishedListing,
      addImages,
      removeImage,
      reorderImages,
      setImageStatus,
      setTitle,
      setDescription,
      setCategory,
      setCondition,
      setTags,
      setPrice,
      setNegotiable,
      setPickupLocationType,
      setCustomPickupNote,
      reset,
    }),
    [draft, publishedListing, setPublishedListing, addImages, removeImage, reorderImages, setImageStatus, setTitle, setDescription, setCategory, setCondition, setTags, setPrice, setNegotiable, setPickupLocationType, setCustomPickupNote, reset]
  );

  return (
    <ListingDraftContext.Provider value={value}>
      {children}
    </ListingDraftContext.Provider>
  );
}

export function useListingDraft(): ListingDraftContextValue {
  const ctx = useContext(ListingDraftContext);
  if (!ctx) {
    throw new Error("useListingDraft must be used within a ListingDraftProvider");
  }
  return ctx;
}
