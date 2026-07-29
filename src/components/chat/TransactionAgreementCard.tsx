import React from "react";
import { Transaction } from "@/types";
import { formatINR } from "@/utils/format";

interface TransactionAgreementCardProps {
  transaction: Transaction;
  itemTitle: string;
  sellerName: string;
  sellerBatch: string;
}

export function TransactionAgreementCard({
  transaction,
  itemTitle,
  sellerName,
  sellerBatch,
}: TransactionAgreementCardProps) {
  if (transaction.status !== "agreed" && transaction.status !== "completed") return null;

  const rows: { label: string; value: string; accent?: boolean }[] = [
    {
      label: "Final Agreed Price",
      value: transaction.finalAmount ? formatINR(transaction.finalAmount) : "—",
      accent: true,
    },
    { label: "Item", value: itemTitle },
    { label: "Seller", value: `${sellerName} (${sellerBatch})` },
    { label: "Pickup Location", value: transaction.pickupLocation ?? "To be decided" },
    { label: "Suggested Pickup Time", value: transaction.pickupTime ?? "To be decided" },
  ];

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-success/30 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">Transaction Agreement</p>
            <p className="text-xs text-gray-500">Offer accepted just now</p>
          </div>
        </div>
        <span className="rounded-full bg-success-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success">
          Confirmed
        </span>
      </div>

      <dl className="divide-y divide-gray-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2.5">
            <dt className="text-sm text-gray-500">{row.label}</dt>
            <dd
              className={[
                "text-sm font-semibold",
                row.accent ? "text-lg text-success" : "text-gray-900",
              ].join(" ")}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 border-t border-gray-100 pt-3 text-center text-xs text-gray-400">
        Both parties have agreed to these terms.
      </p>
    </div>
  );
}
