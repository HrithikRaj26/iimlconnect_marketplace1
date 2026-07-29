"use client";

import Image from "next/image";
import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/utils/format";
import { suggestedOffers } from "@/constants/chat";
import { AsyncStatus } from "@/types";

interface MakeOfferModalProps {
  open: boolean;
  onClose: () => void;
  listing: {
    title: string;
    askingPrice: number;
    imageUrl: string;
    sellerName: string;
    sellerRating?: number;
  };
  onSubmit: (amount: number, message?: string) => Promise<void>;
}

export function MakeOfferModal({ open, onClose, listing, onSubmit }: MakeOfferModalProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const suggestions = suggestedOffers(listing.askingPrice);
  const numericAmount = Number(amount);
  const isValid = amount.trim() !== "" && !Number.isNaN(numericAmount) && numericAmount > 0;

  const handleSend = async () => {
    if (!isValid) {
      setError("Enter a valid offer amount greater than zero.");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      await onSubmit(numericAmount, message.trim() || undefined);
      setStatus("success");
      setAmount("");
      setMessage("");
      onClose();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't send offer. Try again.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="make-offer-title">
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 id="make-offer-title" className="text-lg font-bold text-gray-900">
              Make an Offer
            </h2>
            <p className="text-sm text-gray-500">Negotiate directly with the seller</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Item summary */}
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-200">
            <Image src={listing.imageUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{listing.title}</p>
            <p className="text-xs text-gray-500">
              Seller: {listing.sellerName}
              {listing.sellerRating ? ` · ★ ${listing.sellerRating}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Asking</p>
            <p className="text-sm font-bold text-brand">{formatINR(listing.askingPrice)}</p>
          </div>
        </div>

        {/* Amount */}
        <label className="mb-1.5 block text-sm font-medium text-gray-800">Your Offer Amount</label>
        <div className="mb-3 flex h-14 items-center rounded-xl border border-gray-300 px-4 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <span className="mr-2 text-lg text-gray-400">₹</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            aria-label="Offer amount"
            className="w-full bg-transparent text-2xl font-semibold text-gray-900 outline-none placeholder:text-gray-300"
          />
        </div>

        {/* Suggested offers */}
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Suggested Offers
        </p>
        <div className="mb-2 grid grid-cols-3 gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setAmount(String(s))}
              className={[
                "h-10 rounded-lg border text-sm font-medium transition-colors",
                Number(amount) === s
                  ? "border-brand bg-brand-light text-brand-dark"
                  : "border-gray-200 text-gray-700 hover:border-gray-300",
              ].join(" ")}
            >
              {formatINR(s)}
            </button>
          ))}
        </div>
        <p className="mb-4 text-xs text-gray-400">
          Sellers typically accept offers within 10–15% of asking price.
        </p>

        {/* Optional message */}
        <label className="mb-1.5 block text-sm font-medium text-gray-800">
          Message <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Hi! I'm a PGP 2nd year student interested in your item. Would you consider this offer? I can pick up today."
          className="mb-4 w-full resize-none rounded-xl border border-gray-300 p-3 text-sm text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />

        {/* Notice */}
        <div className="mb-5 flex gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
            <path
              fillRule="evenodd"
              d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-3a1 1 0 100 2 1 1 0 000-2zm1 4a1 1 0 10-2 0v3a1 1 0 102 0v-3z"
              clipRule="evenodd"
            />
          </svg>
          <p>
            Be respectful — the seller is a fellow IIML student. Reasonable offers are more
            likely to be accepted. Spam or lowball offers may be reported.
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-3 text-sm font-medium text-red-500">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth loading={status === "loading"} disabled={!isValid} onClick={handleSend}>
            Send Offer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
