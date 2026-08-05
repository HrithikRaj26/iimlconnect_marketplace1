"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { lostFoundService, ApiError } from "@/services/lostFoundService";
import { DOCUMENTARY_PROOF_TYPES, ProofType } from "@/types/lostFound";

const STANDARD_PROOF_OPTIONS: ProofType[] = ["verbal", ...DOCUMENTARY_PROOF_TYPES];

/**
 * "Handover / Claim" (Section 2.3). Proof options scaled by sensitivity:
 * non-sensitive items allow 'verbal'; sensitive items require documentary/
 * technical proof (AC-8). approver_id is never collected here — the API
 * derives it from the authenticated custodian's own token.
 */
export default function HandoverPage() {
  const params = useParams<{ foundReportId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isSensitive = searchParams.get("sensitive") === "true";
  const proofOptions = isSensitive ? DOCUMENTARY_PROOF_TYPES : STANDARD_PROOF_OPTIONS;

  const [proofType, setProofType] = useState<ProofType | undefined>(undefined);
  const [claimantId, setClaimantId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const approve = async () => {
    if (!proofType) {
      setError("Select a proof type.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await lostFoundService.createHandover({
        foundReportId: params.foundReportId,
        proofType,
        claimantId: claimantId || undefined,
      });
      setDone(true);
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : "Handover failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900">Handover recorded</h1>
        <p className="text-sm text-gray-500">Audit log written — timestamp + approver saved.</p>
        <Button onClick={() => router.back()}>Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-xl font-bold text-gray-900">Process handover</h1>
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          {isSensitive && (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
              Sensitive item — documentary/technical proof required. Verbal description alone is not accepted.
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">Proof of ownership</label>
            <div className="flex flex-wrap gap-2">
              {proofOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setProofType(opt)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    proofType === opt ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                  ].join(" ")}
                >
                  {opt.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <TextInput
            label="Claimant id (optional)"
            value={claimantId}
            onChange={(e) => setClaimantId(e.target.value)}
            placeholder="Supabase user id, if known"
          />

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <Button size="lg" fullWidth loading={submitting} onClick={approve}>
            Approve handover
          </Button>
        </div>
      </div>
    </div>
  );
}
