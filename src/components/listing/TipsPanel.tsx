import React from "react";
import { LISTING_TIPS } from "@/constants/listing";

export function TipsPanel() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div className="mb-2 flex items-center gap-2">
        <span aria-hidden="true" className="text-lg">💡</span>
        <h3 className="text-sm font-semibold text-amber-800">Tips for a great listing</h3>
      </div>
      <ul className="space-y-2">
        {LISTING_TIPS.map((tip) => (
          <li key={tip} className="flex gap-2 text-sm text-amber-800">
            <span aria-hidden="true">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
