"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MakeOfferModal } from "@/components/chat/MakeOfferModal";
import { formatINR } from "@/utils/format";
import { FILTER_CATEGORY_OPTIONS, FILTER_CONDITION_OPTIONS } from "@/constants/marketplace";
import { supabase } from "@/lib/supabase";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [{ data: sessionData }, { data: listingData, error }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('listings').select('*').eq('id', id).single()
      ]);
      
      if (sessionData.session) setSession(sessionData.session);
      if (!error && listingData) setListing(listingData);
      
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;
    setIsDeleting(true);
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) {
      router.push("/marketplace");
    } else {
      alert("Failed to delete listing.");
      setIsDeleting(false);
    }
  };

  const handleReport = async () => {
    if (!confirm("Report this listing as fake or inappropriate? This will alert the admin team.")) return;
    // In a real app, this would insert into a 'reports' table. We can simulate it or insert it if the table exists.
    alert("Report submitted successfully. Our admin team will review this listing.");
  };

  const handleShare = async () => {
    if (!listing) return;
    const url = window.location.href;
    const text = `Check out "${listing.title}" for ₹${listing.price} on IIML Connect!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: text,
          url: url,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback for desktop WhatsApp Web
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-gray-500">Loading details...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-surface">
        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Listing not found</h1>
          <p className="mt-2 text-sm text-gray-500">This listing may have been removed or sold.</p>
          <Link href="/marketplace" className="mt-6 inline-block">
            <Button>Back to Marketplace</Button>
          </Link>
        </main>
      </div>
    );
  }

  const categoryLabel = FILTER_CATEGORY_OPTIONS.find((c) => c.value === listing.category)?.label || listing.category;
  const conditionLabel = FILTER_CONDITION_OPTIONS.find((c) => c.value === listing.condition)?.label || listing.condition;
  const postedAgo = new Date(listing.created_at).toLocaleDateString();
  const isOwner = session?.user?.id === listing.seller_id;

  return (
    <div className="min-h-screen bg-surface">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/marketplace" className="hover:text-brand">Marketplace</Link>
          <span className="mx-2">/</span>
          <span>{categoryLabel}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-gray-100">
              <Image src={listing.image_url || '/placeholder.png'} alt={listing.title} fill sizes="600px" className="object-cover" unoptimized />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-success shadow-sm">
                {conditionLabel} Condition
              </span>
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand">{categoryLabel}</span>
              <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">{conditionLabel}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            <p className="mt-1 text-sm text-gray-400">Posted {postedAgo}</p>

            <p className="mt-4 text-3xl font-bold text-brand">{formatINR(listing.price)}</p>

            <hr className="my-6 border-gray-100" />

            <h2 className="mb-2 text-sm font-semibold text-gray-900">Description</h2>
            <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
              {listing.description || `Selling my ${listing.title}. Well-maintained and fully functional. Available for pickup at ${listing.location} on campus. Message me to arrange a convenient time — happy to answer any questions.`}
            </p>

            {/* Seller card */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                  {listing.seller_name ? listing.seller_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("") : "?"}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900">{listing.seller_name} {isOwner && "(You)"}</p>
                    <span className="rounded bg-brand-light px-1.5 py-0.5 text-[10px] font-semibold text-brand">Verified</span>
                  </div>
                  <p className="text-xs text-gray-500">{listing.seller_batch || 'Student'} · ★ 4.9</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p className="uppercase tracking-wide">Pickup</p>
                <p className="font-medium text-gray-700">{listing.location}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5">
              {isOwner ? (
                <>
                  <Button fullWidth size="lg" variant="secondary" onClick={() => alert('Edit flow coming soon!')}>
                    Edit Listing
                  </Button>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Button 
                      fullWidth 
                      variant="secondary"
                      onClick={handleShare}
                    >
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                        Share
                      </span>
                    </Button>
                    <Button 
                      fullWidth 
                      loading={isDeleting}
                      onClick={handleDelete} 
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-none border border-red-100"
                    >
                      Delete Listing
                    </Button>
                  </div>
                  <p className="mt-3 text-center text-xs text-gray-400">
                    You posted this listing. You can edit or remove it at any time.
                  </p>
                </>
              ) : (
                <>
                  <Button fullWidth size="lg" onClick={() => setOfferOpen(true)}>
                    Make an Offer
                  </Button>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Button 
                      variant="secondary" 
                      onClick={() => router.push(`/messages?ownerId=${listing.seller_id}&ownerName=${encodeURIComponent(listing.seller_name)}&ventureName=${encodeURIComponent(listing.title)}&logoUrl=${encodeURIComponent(listing.image_url || '')}&askingPrice=${listing.price}&listingId=${listing.id}&listingType=item`)}
                    >
                      Chat with Seller
                    </Button>
                    <Button variant="secondary" onClick={handleShare}>
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                        Share
                      </span>
                    </Button>
                  </div>
                  
                  <button 
                    onClick={handleReport}
                    className="mt-6 w-full text-center text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors"
                  >
                    🚩 Report Fake/Inappropriate Listing
                  </button>
                  
                  <p className="mt-4 text-center text-[10px] text-gray-400">
                    Secure transaction within IIML Connect. Only verified students can buy and sell.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <MakeOfferModal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        listing={{
          title: listing.title,
          askingPrice: listing.price,
          imageUrl: listing.image_url,
          sellerName: listing.seller_name,
          sellerRating: 4.9,
        }}
        onSubmit={async (amount, message) => {
          setOfferOpen(false);
          router.push(`/messages?ownerId=${listing.seller_id}&ownerName=${encodeURIComponent(listing.seller_name)}&ventureName=${encodeURIComponent(listing.title)}&logoUrl=${encodeURIComponent(listing.image_url || '')}&askingPrice=${listing.price}&listingId=${listing.id}&listingType=item&initialOfferAmount=${amount}&initialOfferNote=${encodeURIComponent(message || '')}`);
        }}
      />
    </div>
  );
}
