import { EB_Garamond, Jost } from "next/font/google";
import AppLayout from "@/components/layout/AppLayout";

// Garamond and Futura aren't licensed for web embedding — EB Garamond is the
// standard open-source Garamond revival, and Jost is explicitly a geometric
// sans modeled on Futura. Scoped to this module only (not the root layout),
// so the rest of the app keeps its Inter styling.
const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond", weight: ["400", "500", "600", "700"] });
const futura = Jost({ subsets: ["latin"], variable: "--font-futura", weight: ["400", "500", "600", "700"] });

export default function LostFoundLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <div className={`${garamond.variable} ${futura.variable} lost-found-fonts`}>{children}</div>
    </AppLayout>
  );
}
