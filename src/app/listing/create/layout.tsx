"use client";

import React from "react";
import { ListingDraftProvider } from "@/hooks/useListingDraft";

export default function CreateListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ListingDraftProvider>{children}</ListingDraftProvider>;
}
