import AppLayout from "@/components/layout/AppLayout";
import { Space_Grotesk, Manrope } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export default function VenturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .ventures-container h1,
        .ventures-container h2,
        .ventures-container h3,
        .ventures-container h4,
        .ventures-container h5,
        .ventures-container .font-display {
          font-family: var(--font-space-grotesk), sans-serif !important;
        }
        .ventures-container,
        .ventures-container p,
        .ventures-container span,
        .ventures-container button,
        .ventures-container input,
        .ventures-container textarea,
        .ventures-container select,
        .ventures-container label,
        .ventures-container table,
        .ventures-container td,
        .ventures-container th {
          font-family: var(--font-manrope), sans-serif !important;
        }
        
        /* Hide scrollbar utility for horizontal category scroll lists */
        .scrollbar-hide::-webkit-scrollbar {
          display: none !important;
        }
        .scrollbar-hide {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />
      <AppLayout>
        <div className="ventures-container h-full w-full">
          {children}
        </div>
      </AppLayout>
    </div>
  );
}
