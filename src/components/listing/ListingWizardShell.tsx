import React from "react";
import { TopNav } from "@/components/ui/TopNav";
import { Stepper } from "@/components/ui/Stepper";

const STEPS = [
  { label: "Upload Photos", index: 1 },
  { label: "Item Details", index: 2 },
  { label: "Pricing", index: 3 },
  { label: "Preview & Publish", index: 4 },
];

interface ListingWizardShellProps {
  currentStep: number;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function ListingWizardShell({
  currentStep,
  children,
  footer,
}: ListingWizardShellProps) {
  return (
    <div className="min-h-screen bg-surface">
      <TopNav />

      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl">
          <Stepper steps={STEPS} currentIndex={currentStep} />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

      <footer className="sticky bottom-0 border-t border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-xs text-gray-400">Draft auto-saved just now</p>
          <div className="flex gap-3">{footer}</div>
        </div>
      </footer>
    </div>
  );
}
