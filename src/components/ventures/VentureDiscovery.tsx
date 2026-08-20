"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ventureService } from "@/services/ventureService";
import { Venture, VentureCategory, VentureReview } from "@/types";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { supabase } from "@/lib/supabase";
import { updateReviewStreak } from "@/services/streakService";
import { Mic } from "lucide-react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

const CATEGORIES: (VentureCategory | "All")[] = ["All", "Tech", "F&B", "Fashion", "Consulting/Freelance", "Creative/Art", "Services"];

export default function VentureDiscovery() {
  const router = useRouter();
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [featured, setFeatured] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { isListening, startListening } = useVoiceSearch((text) => setSearchQuery(text));
  const [selectedCategory, setSelectedCategory] = useState<VentureCategory | "All">("All");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");

  // Selected Venture for Detail View
  const [activeVenture, setActiveVenture] = useState<(Venture & { reviews: VentureReview[] }) | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showFirstReviewSuccess, setShowFirstReviewSuccess] = useState(false);

  // Featured Carousel Index
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Scratch card states
  const [revealedEmail, setRevealedEmail] = useState(false);
  const [revealedWhatsapp, setRevealedWhatsapp] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [whatsappCopied, setWhatsappCopied] = useState(false);
  const [scratchingEmail, setScratchingEmail] = useState(false);
  const [scratchingWhatsapp, setScratchingWhatsapp] = useState(false);

  // Ref to scroll to details container when it opens
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const [userReviewedVentureIds, setUserReviewedVentureIds] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (currentUserId) {
      supabase
        .from("reviews")
        .select("venture_id")
        .eq("reviewer_id", currentUserId)
        .then(({ data, error }) => {
          if (data && !error) {
            setUserReviewedVentureIds(data.map((r: any) => r.venture_id));
          }
        });
    }
  }, [currentUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await ventureService.getVentures({
        query: searchQuery,
        category: selectedCategory,
        sort: sortBy
      });
      setVentures(data);
      // Filter featured
      setFeatured(data.filter(v => v.is_featured));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, sortBy]);

  // Featured carousel timer
  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % featured.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featured]);

  const handleCardClick = async (id: string) => {
    if (activeVenture?.id === id && showDetailModal) {
      setShowDetailModal(false);
      setActiveVenture(null);
      return;
    }
    setDetailLoading(true);
    setShowDetailModal(true);
    
    // Check localStorage scratch card status
    try {
      const emailsRevealed = JSON.parse(localStorage.getItem("revealed_emails") || "[]");
      const whatsappsRevealed = JSON.parse(localStorage.getItem("revealed_whatsapps") || "[]");
      setRevealedEmail(emailsRevealed.includes(id));
      setRevealedWhatsapp(whatsappsRevealed.includes(id));
    } catch (e) {
      setRevealedEmail(false);
      setRevealedWhatsapp(false);
    }
    
    setScratchingEmail(false);
    setScratchingWhatsapp(false);
    setEmailCopied(false);
    setWhatsappCopied(false);
    try {
      const data = await ventureService.getVentureById(id);
      setActiveVenture(data);
      
      // Smooth scroll to the details section shortly after opening
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    } catch (e) {
      console.error(e);
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVenture) return;
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const newReview = await ventureService.submitReview(activeVenture.id, rating, reviewContent);
      
      // Update local state with new review & refresh aggregates
      const updatedReviews = [newReview, ...activeVenture.reviews];
      const nextAvg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
      
      setActiveVenture({
        ...activeVenture,
        reviews: updatedReviews,
        reviews_count: updatedReviews.length,
        average_rating: parseFloat(nextAvg.toFixed(2))
      });

      // Refresh listings
      loadData();
      setUserReviewedVentureIds(prev => [...prev, activeVenture.id]);
      
      setReviewContent("");
      setRating(5);

      // Check if this was the user's first review
      if (currentUserId) {
        // Update review streak (fire-and-forget)
        updateReviewStreak(currentUserId);

        const { count } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("reviewer_id", currentUserId);
        
        if (count === 1) {
          setShowFirstReviewSuccess(true);
        }
      }
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleContactFounder = () => {
    if (!activeVenture) return;
    // URL routing helper: redirect to Messages
    const url = `/messages?ownerId=${activeVenture.owner_id}&ownerName=${encodeURIComponent(activeVenture.owner_name)}&ventureName=${encodeURIComponent(activeVenture.name)}&logoUrl=${encodeURIComponent(activeVenture.logo_url || '')}&listingId=${activeVenture.id}&listingType=venture`;
    router.push(url);
  };

  return (
    <div className="space-y-8">
      {/* Featured Carousel */}
      {featured.length > 0 && (
        <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
            <span className="self-start rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white shadow-sm">
              🔥 Featured Startup
            </span>
            <div>
              <h2 className="text-xl font-black md:text-2xl">{featured[carouselIndex].name}</h2>
              <p className="mt-1 text-xs font-semibold text-white/90 line-clamp-1">{featured[carouselIndex].tagline}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/80">
                Created by {featured[carouselIndex].owner_name}
              </span>
              <button
                type="button"
                onClick={() => handleCardClick(featured[carouselIndex].id)}
                className="rounded-xl bg-white px-5 py-2.5 text-xs font-black text-orange-600 shadow hover:bg-orange-50 transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
          {/* Navigation Dots */}
          {featured.length > 1 && (
            <div className="absolute bottom-4 right-6 flex gap-1.5">
              {featured.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    carouselIndex === idx ? "bg-white w-4" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky Filters & Categories Container */}
      <div className="sticky -top-8 z-10 bg-gray-50 dark:bg-gray-950 pt-8 pb-4 space-y-4 transition-colors duration-300">
        {/* Discovery Filters Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          {/* Search */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search startups, offerings, key terms..."
              className="block w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50 py-2.5 pl-10 pr-12 text-sm font-semibold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-gray-900 transition-all text-gray-800 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={startListening}
              className={`absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
              title="Voice Search"
            >
              <Mic size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort By:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "popular")}
                className="appearance-none rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-3 pr-8 py-2 text-xs font-extrabold text-gray-805 dark:text-gray-200 focus:border-orange-500 focus:outline-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%25234b5563%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.1rem_1.1rem] bg-no-repeat"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-extrabold shadow-sm transition-all ${
                  isActive
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-300 border border-gray-200 dark:border-gray-855 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/80 bg-white/50 backdrop-blur-md p-6 h-64 flex flex-col justify-between animate-pulse">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-gray-200 animate-shimmer" />
                  <div className="h-5 w-16 rounded-full bg-gray-200 animate-shimmer" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200 animate-shimmer" />
                  <div className="h-3 w-1/2 rounded bg-gray-200 animate-shimmer" />
                </div>
              </div>
              <div className="h-10 w-full rounded-xl bg-gray-200 animate-shimmer" />
            </div>
          ))}
        </div>
      ) : ventures.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 py-16 px-6 text-center">
          <span className="text-5xl">🚀</span>
          <h3 className="mt-4 text-lg font-bold text-gray-900">No Ventures Found</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-xs">
            Be the pioneer! Create and showcase the first venture under this category today.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <style>{`
            @keyframes pulse-glow {
              0%, 100% { box-shadow: 0 4px 15px -3px rgba(245, 158, 11, 0.15), 0 4px 6px -2px rgba(245, 158, 11, 0.05); }
              50% { box-shadow: 0 10px 25px -3px rgba(245, 158, 11, 0.35), 0 8px 10px -2px rgba(245, 158, 11, 0.15); }
            }
            .animate-pulse-subtle {
              animation: pulse-glow 3s infinite ease-in-out;
            }
          `}</style>
          {ventures.map((venture) => {
            const isExpanded = activeVrientIdMatch(venture.id);
            function activeVrientIdMatch(id: string) {
              return activeVenture?.id === id && showDetailModal;
            }
            const hasReviewed = userReviewedVentureIds.includes(venture.id);
            return (
              <React.Fragment key={venture.id}>
                {/* Venture Card */}
                <div
                  onClick={() => handleCardClick(venture.id)}
                  className={`group flex flex-col justify-between rounded-3xl bg-white/60 dark:bg-gray-900/65 hover:bg-white/95 dark:hover:bg-gray-900/95 backdrop-blur-md p-6 border transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-orange-500/5 hover:-translate-y-1.5 ${
                    venture.is_featured 
                      ? "border-amber-400/80 dark:border-amber-500/80 shadow-md shadow-amber-500/5 hover:border-amber-500 ring-2 ring-amber-400/10 animate-pulse-subtle" 
                      : "border-gray-100 dark:border-gray-800 shadow-sm hover:border-orange-500/20 dark:hover:border-orange-500/30"
                  } ${isExpanded ? "ring-2 ring-orange-500/50 scale-98 border-orange-500/50 dark:border-orange-500/50" : ""} ${hasReviewed ? "opacity-90 border-green-500/20 dark:border-green-500/15" : ""}`}
                >
                  <div>
                    {/* Logo and Category */}
                    <div className="flex items-center justify-between">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-gray-50 border border-gray-150 shrink-0">
                        <img
                          src={venture.logo_url || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=150&h=150&fit=crop"}
                          alt={venture.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {hasReviewed && (
                          <span className="rounded-full bg-green-50 dark:bg-green-950/40 px-2 py-0.5 text-[9px] font-black text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-900/30 shadow-xs">
                            ✓ Reviewed
                          </span>
                        )}
                        {venture.is_featured && (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black text-amber-700 animate-bounce">
                            ★ Featured
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold border ${
                          venture.is_open 
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${venture.is_open ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                          {venture.is_open ? "Open" : "Closed"}
                        </span>
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-600">
                          {venture.category}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <h3 className="mt-4 text-base font-extrabold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {venture.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-gray-400 line-clamp-1">
                      By {venture.owner_name} ({venture.owner_batch})
                    </p>
                    <p className="mt-3 text-sm font-medium text-gray-500 line-clamp-2 leading-relaxed">
                      {venture.tagline}
                    </p>

                    {/* Rating */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-black text-amber-700">
                        <span>★</span>
                        <span>{venture.average_rating}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-400">({venture.reviews_count} reviews)</span>
                    </div>

                    {/* Offerings snippet */}
                    {venture.offerings.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {venture.offerings.slice(0, 2).map((offering, idx) => (
                          <span key={idx} className="rounded bg-gray-50 border border-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 truncate max-w-[120px]">
                            {offering}
                          </span>
                        ))}
                        {venture.offerings.length > 2 && (
                          <span className="text-[10px] font-bold text-gray-400 self-center pl-1">
                            +{venture.offerings.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer CTA actions */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 text-xs font-extrabold">
                    {venture.contact_links?.website ? (
                      <a
                        href={venture.contact_links.website}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-center py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-extrabold shadow-sm hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-orange-600/10 group-hover:shadow-md group-hover:shadow-orange-600/20"
                      >
                        <span>Visit Website</span>
                        <span className="text-sm">↗</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="flex-1 text-center py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-extrabold shadow-sm hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-orange-600/10 group-hover:shadow-md group-hover:shadow-orange-600/20"
                      >
                        <span>View Details</span>
                        <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Venture Expanded Details Panel (Rendered just below the card) */}
                {isExpanded && (
                  <div 
                    ref={detailsRef}
                    className="col-span-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 space-y-6"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside details
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                      <span className="text-sm font-bold text-gray-450 uppercase tracking-widest">Startup Profile details</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetailModal(false);
                          setActiveVenture(null);
                        }}
                        className="h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 font-extrabold text-lg transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Content body */}
                    {detailLoading || !activeVenture ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Branding block */}
                        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 shadow-sm shrink-0">
                              <img
                                src={activeVenture.logo_url || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=150&h=150&fit=crop"}
                                alt={activeVenture.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-black text-gray-900 md:text-2xl">{activeVenture.name}</h2>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                  activeVenture.is_open 
                                    ? "bg-green-50 text-green-700 border-green-200" 
                                    : "bg-gray-50 text-gray-500 border-gray-200"
                                }`}>
                                  <span className={`h-2 w-2 rounded-full ${activeVenture.is_open ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                                  {activeVenture.is_open ? "Open Now" : "Closed"}
                                </span>
                                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-600">
                                  {activeVenture.category}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-bold text-gray-500">{activeVenture.tagline}</p>
                              <p className="mt-2 text-xs font-semibold text-gray-400">
                                Founded by <span className="text-gray-700">{activeVenture.owner_name}</span> ({activeVenture.owner_batch})
                              </p>
                            </div>
                          </div>

                          {/* Rating summary */}
                          <div className="flex flex-row items-center gap-3 border-l-0 md:border-l border-gray-100 pl-0 md:pl-6">
                            <div className="text-center">
                              <p className="text-3xl font-black text-orange-600">★ {activeVenture.average_rating}</p>
                              <p className="text-xs font-bold text-gray-400 mt-1">{activeVenture.reviews_count} student reviews</p>
                            </div>
                          </div>
                        </div>

                        {/* About & Offerings grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Pitch description */}
                          <div className="md:col-span-2 space-y-4">
                            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">About the Venture</h3>
                            <p className="text-sm font-medium leading-relaxed text-gray-600 whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                              {activeVenture.description}
                            </p>
                          </div>

                          {/* Contact coordinates & offerings */}
                          <div className="space-y-6">
                            {/* Offerings list */}
                            {activeVenture.offerings.length > 0 && (
                              <div className="space-y-3">
                                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Our Offerings</h3>
                                <ul className="space-y-2">
                                  {activeVenture.offerings.map((offering, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                      <span className="text-orange-500">✓</span> {offering}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {/* Social coordinates */}
                            <div className="space-y-3">
                              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Connect Details</h3>
                              
                              <style>{`
                                @keyframes scratch-wipe {
                                  0% { clip-path: inset(0 0 0 0); opacity: 1; }
                                  100% { clip-path: inset(0 0 0 100%); opacity: 0.1; }
                                }
                                .animate-scratch-wipe {
                                  animation: scratch-wipe 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                                }
                              `}</style>

                              <div className="flex flex-col gap-3">
                                {/* WhatsApp Scratch Card */}
                                {activeVenture.contact_links.whatsapp && (
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">WhatsApp Contact</span>
                                    <div className="relative overflow-hidden rounded-xl border border-green-100 bg-green-50/20 p-3 min-h-[50px] flex flex-col justify-center">
                                      {/* Revealed Details (Underside) */}
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-bold text-gray-700 select-all">{activeVenture.contact_links.whatsapp}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(activeVenture.contact_links.whatsapp || "");
                                              setWhatsappCopied(true);
                                              setTimeout(() => setWhatsappCopied(false), 2000);
                                            }}
                                            className="shrink-0 bg-green-600 hover:bg-green-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider uppercase transition-colors"
                                          >
                                            {whatsappCopied ? "✓ Copied" : "📋 Copy"}
                                          </button>
                                        </div>
                                        <a
                                          href={`https://wa.me/${activeVenture.contact_links.whatsapp.replace(/\D/g, '')}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="w-full text-center bg-green-500 hover:bg-green-600 text-white rounded-lg py-1.5 text-[10px] font-black tracking-wider uppercase transition-colors flex items-center justify-center gap-1 shadow-sm"
                                        >
                                          <span>Open WhatsApp</span>
                                          <span>↗</span>
                                        </a>
                                      </div>

                                      {/* Scratch Foil Cover (Top-side overlay) */}
                                      {!revealedWhatsapp && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!scratchingWhatsapp) {
                                              setScratchingWhatsapp(true);
                                              setTimeout(() => {
                                                try {
                                                  const whatsapps = JSON.parse(localStorage.getItem("revealed_whatsapps") || "[]");
                                                  if (!whatsapps.includes(activeVenture.id)) {
                                                    whatsapps.push(activeVenture.id);
                                                    localStorage.setItem("revealed_whatsapps", JSON.stringify(whatsapps));
                                                  }
                                                } catch (err) {}
                                                setRevealedWhatsapp(true);
                                                setScratchingWhatsapp(false);
                                              }, 600);
                                            }
                                          }}
                                          className={`absolute inset-0 z-10 w-full h-full bg-gradient-to-br from-green-100 to-emerald-200 border border-dashed border-green-300 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:brightness-105 active:brightness-95 ${
                                            scratchingWhatsapp ? "animate-scratch-wipe pointer-events-none" : ""
                                          }`}
                                        >
                                          <span className="text-xs font-black text-green-800 flex items-center gap-1.5 animate-pulse">
                                            <span>💬</span>
                                            <span>Reveal WhatsApp</span>
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Email Scratch Card */}
                                {activeVenture.contact_links.email && (
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Email Contact</span>
                                    <div className="relative overflow-hidden rounded-xl border border-orange-100 bg-orange-50/20 p-3 min-h-[50px] flex flex-col justify-center">
                                      {/* Revealed Details (Underside) */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-gray-700 truncate select-all">{activeVenture.contact_links.email}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(activeVenture.contact_links.email || "");
                                            setEmailCopied(true);
                                            setTimeout(() => setEmailCopied(false), 2000);
                                          }}
                                          className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider uppercase transition-colors"
                                        >
                                          {emailCopied ? "✓ Copied" : "📋 Copy"}
                                        </button>
                                      </div>

                                      {/* Scratch Foil Cover (Top-side overlay) */}
                                      {!revealedEmail && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!scratchingEmail) {
                                              setScratchingEmail(true);
                                              setTimeout(() => {
                                                try {
                                                  const emails = JSON.parse(localStorage.getItem("revealed_emails") || "[]");
                                                  if (!emails.includes(activeVenture.id)) {
                                                    emails.push(activeVenture.id);
                                                    localStorage.setItem("revealed_emails", JSON.stringify(emails));
                                                  }
                                                } catch (err) {}
                                                setRevealedEmail(true);
                                                setScratchingEmail(false);
                                              }, 600);
                                            }
                                          }}
                                          className={`absolute inset-0 z-10 w-full h-full bg-gradient-to-br from-orange-100 to-amber-200 border border-dashed border-orange-300 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:brightness-105 active:brightness-95 ${
                                            scratchingEmail ? "animate-scratch-wipe pointer-events-none" : ""
                                          }`}
                                        >
                                          <span className="text-xs font-black text-orange-800 flex items-center gap-1.5 animate-pulse">
                                            <span>✉️</span>
                                            <span>Reveal Email</span>
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {activeVenture.contact_links.instagram && (
                                  <a
                                    href={`https://instagram.com/${activeVenture.contact_links.instagram}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity mt-1"
                                  >
                                    📸 Instagram Profile
                                  </a>
                                )}
                                {activeVenture.contact_links.website && (
                                  <a
                                    href={activeVenture.contact_links.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800 py-2 text-xs font-bold text-white shadow-sm hover:bg-gray-900 transition-colors"
                                  >
                                    🌐 Visit Website
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Handoff CTA */}
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-black text-orange-900">Want to discuss collaborations or place custom orders?</h4>
                            <p className="text-xs font-medium text-orange-700 mt-1">Reuses IIML Connect messaging network. Safe, student-to-student authentication.</p>
                          </div>
                          {activeVenture.owner_id !== currentUserId ? (
                            <Button onClick={handleContactFounder}>Contact Founder</Button>
                          ) : (
                            <span className="text-xs font-bold text-orange-600 bg-orange-100/50 rounded px-2.5 py-1">You own this venture</span>
                          )}
                        </div>

                        {/* Reviews Shelf */}
                        <div className="space-y-6">
                          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Reviews & Ratings</h3>

                          {/* Review submission Form */}
                          {activeVenture.owner_id !== currentUserId && (() => {
                            const hasSubmittedReview = activeVenture.reviews.some(r => r.reviewer_id === currentUserId) || userReviewedVentureIds.includes(activeVenture.id);
                            if (!hasSubmittedReview) {
                              return (
                                <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-600">Rate this startup:</span>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          type="button"
                                          key={star}
                                          onClick={() => setRating(star)}
                                          onMouseEnter={() => setHoverRating(star)}
                                          onMouseLeave={() => setHoverRating(null)}
                                          className={`text-2xl focus:outline-none transition-all duration-150 hover:scale-125 active:scale-95 ${
                                            (hoverRating !== null ? hoverRating >= star : rating >= star)
                                              ? "text-amber-500 scale-105 filter drop-shadow-[0_0_2px_rgba(245,158,11,0.4)]"
                                              : "text-gray-300"
                                          }`}
                                        >
                                          ★
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <TextArea
                                    placeholder="Share your verified experience with this venture... (quality of service, delivery, product feedback)"
                                    value={reviewContent}
                                    onChange={(e) => setReviewContent(e.target.value)}
                                    required
                                    rows={3}
                                  />

                                  {reviewError && (
                                    <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                                      ⚠️ {reviewError}
                                    </p>
                                  )}

                                  <div className="flex justify-end">
                                    <Button type="submit" loading={reviewSubmitting}>
                                      Submit Review
                                    </Button>
                                  </div>
                                </form>
                              );
                            } else {
                              return (
                                <div className="bg-green-50/50 dark:bg-green-950/10 border border-green-150 dark:border-green-900/50 p-4 rounded-xl text-center space-y-1">
                                  <p className="text-xs font-bold text-green-800 dark:text-green-400">
                                    ✅ You have already submitted a review for this venture.
                                  </p>
                                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                                    Only one review per student is allowed.
                                  </p>
                                </div>
                              );
                            }
                          })()}

                          {/* Reviews List */}
                          <div className="space-y-4">
                            {activeVenture.reviews.length === 0 ? (
                              <p className="text-xs font-bold text-gray-400 italic text-center py-4">
                                No reviews submitted yet. Be the first to share your experience!
                              </p>
                            ) : (
                              activeVenture.reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-100 pb-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs font-extrabold text-gray-900">{review.reviewer_name}</p>
                                      <p className="text-[10px] font-semibold text-gray-400">{review.reviewer_batch}</p>
                                    </div>
                                    <span className="text-xs font-black text-amber-600 bg-amber-50 rounded px-2 py-0.5">
                                      {"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}
                                    </span>
                                  </div>
                                  {review.content && (
                                    <p className="text-xs font-medium text-gray-600 leading-relaxed bg-gray-50/20 p-2 rounded border border-gray-50">
                                      {review.content}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-gray-400 text-right">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* First Review Milestone Confetti Success Modal */}
      <AnimatePresence>
        {showFirstReviewSuccess && (
          <motion.div
            key="review-success-overlay"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
          >
          <motion.div
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 max-w-sm w-full overflow-hidden"
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0,
              transition: { type: "spring", stiffness: 400, damping: 28 } }}
            exit={{ opacity: 0, scale: 0.92, y: 12,
              transition: { duration: 0.18, ease: "easeIn" } }}
          >
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
            .confetti-particle {
              position: absolute;
              top: -20px;
              animation: confetti-fall 3s linear infinite;
            }
          `}</style>
          
          {/* Confetti container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[...Array(35)].map((_, i) => {
              const colors = ["#f97316", "#3b82f6", "#10b981", "#eab308", "#ec4899", "#8b5cf6"];
              const color = colors[i % colors.length];
              const left = `${Math.random() * 100}%`;
              const delay = `${Math.random() * 2.5}s`;
              const duration = `${2 + Math.random() * 2}s`;
              const size = `${6 + Math.random() * 8}px`;
              const shape = i % 2 === 0 ? "rounded-full" : "rounded-sm";
              return (
                <div
                  key={i}
                  className={`confetti-particle ${shape}`}
                  style={{
                    left,
                    backgroundColor: color,
                    width: size,
                    height: size,
                    animationDelay: delay,
                    animationDuration: duration,
                  }}
                />
              );
            })}
          </div>

          {/* Success Dialog */}
          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 z-20 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500 border border-amber-100 shadow-sm animate-bounce">
              <span className="text-3xl">⭐️</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">🎉 Milestone Unlocked!</h3>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">First Review Submitted</p>
              <p className="text-sm font-medium text-gray-500 leading-relaxed pt-2">
                Congratulations! You have successfully submitted your **first review** on the IIM Lucknow Venture Hub.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed bg-gray-50 p-3 rounded-xl border">
                Your ratings and feedback help student startups improve their offerings, build credibility, and gain traction on campus. Keep supporting student founders!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFirstReviewSuccess(false)}
              className="w-full rounded-xl bg-orange-600 px-5 py-3 text-xs font-black text-white hover:bg-orange-700 shadow-md transition-colors"
            >
              Awesome! 🚀
            </button>
          </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
