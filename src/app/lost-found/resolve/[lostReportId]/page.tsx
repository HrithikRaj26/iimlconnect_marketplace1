"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { lostFoundService, ApiError } from "@/services/lostFoundService";
import { BackToLostFound } from "@/components/lost-found/BackToLostFound";

/** "Resolution" (Section 2.3): mark resolved + optional thank-you + finder badge. */
export default function ResolvePage() {
  const params = useParams<{ lostReportId: string }>();
  const router = useRouter();
  const [thankYouNote, setThankYouNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ badgeAwarded: boolean } | null>(null);

  const resolve = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const data = await lostFoundService.resolve(params.lostReportId, {
        thankYouNote: thankYouNote || undefined,
      });
      setResult(data);
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : "Could not mark resolved");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900">Marked resolved 🎉</h1>
        {result.badgeAwarded && (
          <p className="text-sm text-gray-500">The finder has been awarded a recognition badge.</p>
        )}
        <Button onClick={() => router.push("/lost-found")}>Back to My Reports</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <BackToLostFound />
        <h1 className="mb-6 text-xl font-bold text-gray-900">Mark resolved</h1>
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <TextArea
            label="Optional thank-you note to the finder"
            value={thankYouNote}
            onChange={(e) => setThankYouNote(e.target.value)}
            placeholder="Thank you so much for returning it!"
            rows={4}
          />
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <Button size="lg" fullWidth loading={submitting} onClick={resolve}>
            Mark resolved
          </Button>
        </div>
      </div>
    </div>
  );
}
