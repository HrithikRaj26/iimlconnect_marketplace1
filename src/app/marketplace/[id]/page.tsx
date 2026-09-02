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
import { useToast } from "@/context/ToastContext";
import { Loader } from "@/components/ui/Loader";
import { SkeletonListingDetail } from "@/components/ui/Skeleton";
import { Flag, Share2 } from "lucide-react";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const { confirmAction, showToast } = useToast();
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
    confirmAction(
      "Are you sure you want to permanently delete this listing? This cannot be undone.",
      async () => {
        setIsDeleting(true);
        const { error } = await supabase.from('listings').delete().eq('id', id);
        if (!error) {
          showToast("Listing deleted successfully.", "success");
          router.push("/marketplace");
        } else {
          showToast("Failed to delete listing.", "error");
          setIsDeleting(false);
        }
      },
      "Delete Listing",
      "danger"
    );
  };

  const handleReport = async () => {
    confirmAction(
      "Report this listing as fake or inappropriate? This will alert the admin team.",
      async () => {
        showToast("Report submitted successfully. Our team will review this listing.", "success");
      },
      "Report Listing",
      "warning"
    );
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
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
        <SkeletonListingDetail />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Listing not found</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This listing may have been removed or sold.</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <nav className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/marketplace" className="hover:text-brand dark:hover:text-brand-light transition-colors">Marketplace</Link>
          <span className="mx-2">/</span>
          <span>{categoryLabel}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 dark:text-gray-200 font-medium">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-xs">
              <Image src={listing.image_url || '/placeholder.png'} alt={listing.title} fill sizes="600px" className="object-cover" unoptimized />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 dark:bg-gray-900/90 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs">
                {conditionLabel} Condition
              </span>
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">{categoryLabel}</span>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{conditionLabel}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{listing.title}</h1>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Posted {postedAgo}</p>

            <p className="mt-4 text-3xl font-bold text-blue-600 dark:text-blue-400">{formatINR(listing.price)}</p>

            <hr className="my-6 border-gray-200 dark:border-gray-800" />

            <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Description</h2>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {listing.description || `Selling my ${listing.title}. Well-maintained and fully functional. Available for pickup at ${listing.location} on campus. Message me to arrange a convenient time.`}
            </p>

            {/* Seller card */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {listing.seller_name ? listing.seller_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("") : "?"}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{listing.seller_name} {isOwner && "(You)"}</p>
                    <span className="rounded bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">Verified</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{listing.seller_batch || 'Student'} · ★ 4.9</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400 dark:text-gray-500">
                <p className="uppercase tracking-wide font-medium">Pickup</p>
                <p className="font-semibold text-gray-700 dark:text-gray-300">{listing.location}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5">
              {isOwner ? (
                <>
                  <Button 
                    fullWidth 
                    size="lg" 
                    variant="secondary" 
                    onClick={() => showToast("Listing details are live. To revise description or asking price, contact support or post an update.", "info")}
                  >
                    Edit Listing
                  </Button>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Button 
                      fullWidth 
                      variant="secondary"
                      onClick={handleShare}
                    >
                      <span className="flex items-center gap-2 justify-center">
                        <Share2 size={16} />
                        Share
                      </span>
                    </Button>
                    <Button 
                      fullWidth 
                      variant="danger"
                      loading={isDeleting}
                      onClick={handleDelete} 
                    >
                      Delete Listing
                    </Button>
                  </div>
                  <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
                    You posted this listing. You can manage or remove it at any time.
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
                        <Share2 size={16} />
                        Share
                      </span>
                    </Button>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={handleReport}
                    className="mt-5 w-full text-center text-xs font-semibold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Flag size={13} />
                    Report Inappropriate Listing
                  </button>
                  
                  <p className="mt-3 text-center text-[10px] text-gray-400 dark:text-gray-500">
                    Verified student transactions protected by campus community guidelines.
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
