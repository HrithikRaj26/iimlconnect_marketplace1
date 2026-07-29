import { redirect } from "next/navigation";

// Feature 2 (Search & Filters marketplace browse) is the app's landing page.
export default function RootPage() {
  redirect("/marketplace");
}
