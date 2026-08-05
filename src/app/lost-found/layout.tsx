import { Jost } from "next/font/google";
import AppLayout from "@/components/layout/AppLayout";

// Futura itself isn't licensed for web embedding — Jost is explicitly a
// geometric sans modeled on it. Scoped to this module only (not the root
// layout), so the rest of the app keeps its Inter styling.
const futura = Jost({ subsets: ["latin"], variable: "--font-futura", weight: ["400", "500", "600", "700"] });

export default function LostFoundLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <div className={`${futura.variable} lost-found-fonts`}>{children}</div>
    </AppLayout>
  );
}
