"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ventureService } from "@/services/ventureService";
import { Venture, VentureCategory, VentureReview } from "@/types";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { supabase } from "@/lib/supabase";
import { updateReviewStreak } from "@/services/streakService";
import { playSuccessSound } from "@/utils/audio";
import { Mic, Search } from "lucide-react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

const CATEGORIES: (VentureCategory | "All")[] = ["All", "Tech", "F&B", "Fashion", "Consulting/Freelance", "Creative/Art", "Services"];
type VentureCategoryOrAll = VentureCategory | "All";

export default function VentureDiscovery() {
  const router = useRouter();
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [featured, setFeatured] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { isListening, startListening } = useVoiceSearch((text) => setSearchQuery(text));
  const [selectedCategory, setSelectedCategory] = useState<VentureCategoryOrAll>("All");
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
        category: selectedCategory as any,
        sort: sortBy
      });
      setVentures(data);
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
    }, 6000);
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
      
      const updatedReviews = [newReview, ...activeVenture.reviews];
      const nextAvg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
      
      setActiveVenture({
        ...activeVenture,
        reviews: updatedReviews,
        reviews_count: updatedReviews.length,
        average_rating: parseFloat(nextAvg.toFixed(2))
      });

      loadData();
      setUserReviewedVentureIds(prev => [...prev, activeVenture.id]);
      
      setReviewContent("");
      setRating(5);

      if (currentUserId) {
        updateReviewStreak(currentUserId);

        const { count } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("reviewer_id", currentUserId);
        
        if (count === 1) {
          playSuccessSound();
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
    const url = `/messages?ownerId=${activeVenture.owner_id}&ownerName=${encodeURIComponent(activeVenture.owner_name)}&ventureName=${encodeURIComponent(activeVenture.name)}&logoUrl=${encodeURIComponent(activeVenture.logo_url || '')}&listingId=${activeVenture.id}&listingType=venture`;
    router.push(url);
  };

  // Helper to resolve custom trust labels based on metrics
  const getTrustBadgeText = (venture: Venture) => {
    if (venture.reviews_count >= 5) return "🏆 Verified Campus Favorite";
    if (venture.average_rating >= 4.7) return "🌟 100% Student Approved";
    if (venture.category === "F&B") return "🍔 Fast Campus Delivery";
    if (venture.category === "Tech") return "💻 Verified Deployments";
    return "🤝 Peer Recommended";
  };

  return (
    <div className="space-y-10">
      {/* Editorial Featured Enterprise Spotlight */}
      {featured.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 rounded-md flex flex-col md:flex-row gap-8 items-start relative transition-all duration-300">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded border border-blue-200/50 dark:border-blue-900/35 font-sans">
                📰 Enterprise Spotlight
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded">
                Founder Spotlight
              </span>
            </div>
            
            <h2 className="text-3xl font-black text-gray-950 dark:text-white leading-tight">
              {featured[carouselIndex].name}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              "{featured[carouselIndex].tagline}"
            </p>
            
            {/* Founder Profile Details */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 shrink-0">
                {featured[carouselIndex].owner_name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white leading-none">
                  {featured[carouselIndex].owner_name}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 leading-none">
                  Founder & CEO ({featured[carouselIndex].owner_batch})
                </p>
              </div>
            </div>
            
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => handleCardClick(featured[carouselIndex].id)}
                className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-6 py-3 transition-colors shadow-xs"
              >
                Read Journal Story & Contact
              </button>
              
              <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Venture Category: <span className="text-gray-900 dark:text-white font-black">{featured[carouselIndex].category}</span>
              </span>
            </div>
          </div>
          
          <div className="hidden md:block w-px self-stretch bg-gray-150 dark:bg-gray-800" />
          
          <div className="w-full md:w-80 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Founder's Journal Entry
            </h4>
            <blockquote className="text-xs italic text-gray-500 dark:text-gray-450 border-l-2 border-gray-250 dark:border-gray-700 pl-4 py-1 leading-relaxed">
              "We built {featured[carouselIndex].name} to address a real need on the IIM Lucknow campus. Our mission is to provide high-quality services directly to peers with student-friendly economics."
            </blockquote>
            
            {/* Platform Trust Stat */}
            <div className="bg-gray-50 dark:bg-gray-950/20 p-4 rounded-md border border-gray-150 dark:border-gray-850">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Platform Reputation</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  ★ {featured[carouselIndex].average_rating}
                </span>
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                  ({featured[carouselIndex].reviews_count} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacing Divider */}
      <hr className="border-gray-200 dark:border-gray-800" />

      {/* Sticky Filters & Search */}
      <div className="sticky -top-8 z-10 bg-gray-50 dark:bg-gray-950 pt-8 pb-4 space-y-4 transition-colors duration-300">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-800 shadow-xs">
          {/* Search */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search startups, offerings, key terms..."
              className="block w-full rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50 py-2.5 pl-10 pr-12 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all text-gray-800 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={startListening}
              className={`absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
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
                className="appearance-none rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-3 pr-8 py-2 text-xs font-extrabold text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:outline-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%25234b5563%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.1rem_1.1rem] bg-no-repeat"
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
                className={`whitespace-nowrap rounded-md px-4 py-2 text-xs font-extrabold transition-all ${
                  isActive
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending Campus Ventures (Asymmetric 2-Column Grid) */}
      {!loading && ventures.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
            ⚡ Trending Campus Enterprises
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ventures.slice(0, 2).map((venture) => {
              const hasReviewed = userReviewedVentureIds.includes(venture.id);
              const isExpanded = activeVenture?.id === venture.id && showDetailModal;

              return (
                <div
                  key={`trending-${venture.id}`}
                  onClick={() => handleCardClick(venture.id)}
                  className={`group flex flex-col md:flex-row gap-4 p-5 rounded-md border bg-white dark:bg-gray-900 hover:border-blue-500/40 dark:hover:border-blue-500/30 transition-all cursor-pointer shadow-xs min-h-[140px] ${
                    isExpanded ? "ring-2 ring-blue-500/40 border-blue-500" : "border-gray-200 dark:border-gray-800"
                  }`}
                >
                  <div className="h-16 w-16 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 shrink-0 overflow-hidden relative">
                    <img
                      src={venture.logo_url || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=150&h=150&fit=crop"}
                      alt={venture.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-150 dark:border-blue-900/40">
                          {venture.category}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                          {getTrustBadgeText(venture)}
                        </span>
                      </div>
                      
                      <h4 className="mt-2 text-base font-bold text-gray-950 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                        {venture.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Led by {venture.owner_name} ({venture.owner_batch})
                      </p>
                      
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-450 line-clamp-1 leading-normal">
                        {venture.tagline}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-0.5">
                        ★ {venture.average_rating}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">({venture.reviews_count} reviews)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Directory (Standard list details) */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
          📋 Campus Enterprise Directory
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-md border border-gray-200 bg-white p-6 h-60 flex flex-col justify-between animate-pulse">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-md bg-gray-200 animate-shimmer" />
                    <div className="h-5 w-16 rounded bg-gray-200 animate-shimmer" />
                  </div>
                  <div className="h-4 w-3/4 rounded bg-gray-200 animate-shimmer" />
                  <div className="h-3 w-1/2 rounded bg-gray-200 animate-shimmer" />
                </div>
                <div className="h-10 w-full rounded bg-gray-200 animate-shimmer" />
              </div>
            ))}
          </div>
        ) : ventures.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 py-16 px-6 text-center">
            <span className="text-5xl">🏢</span>
            <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">No Ventures Found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Be the first to list a venture under this category today!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ventures.map((venture) => {
              const isExpanded = activeVenture?.id === venture.id && showDetailModal;
              
              return (
                <React.Fragment key={venture.id}>
                  {/* Grid Item Card */}
                  <div
                    onClick={() => handleCardClick(venture.id)}
                    className={`group flex flex-col justify-between rounded-md bg-white dark:bg-gray-900 p-6 border transition-all duration-150 cursor-pointer hover:border-blue-500/30 ${
                      venture.is_featured 
                        ? "border-amber-400/80 dark:border-amber-500/80 shadow-xs" 
                        : "border-gray-200 dark:border-gray-800"
                    } ${isExpanded ? "ring-2 ring-blue-500/40 border-blue-500" : ""}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="relative h-12 w-12 overflow-hidden rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 shrink-0">
                          <img
                            src={venture.logo_url || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=150&h=150&fit=crop"}
                            alt={venture.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {venture.is_featured && (
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-black text-amber-700">
                              ★ Spotlight
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-extrabold border ${
                            venture.is_open 
                              ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" 
                              : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-755"
                          }`}>
                            {venture.is_open ? "Active" : "Closed"}
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {venture.name}
                      </h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        By {venture.owner_name} ({venture.owner_batch})
                      </p>
                      
                      <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-450 line-clamp-2 leading-relaxed">
                        {venture.tagline}
                      </p>

                      {/* Trust metrics */}
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-0.5">
                          ★ {venture.average_rating}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">({venture.reviews_count} reviews)</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 text-xs font-bold">
                      <button
                        type="button"
                        className="flex-1 text-center py-2 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-750 text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        View Enterprise Profile & Details
                      </button>
                    </div>
                  </div>

                  {/* Expanded Profile details */}
                  {isExpanded && (
                    <div 
                      ref={detailsRef}
                      className="col-span-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-6 md:p-8 shadow-md animate-in fade-in slide-in-from-top-4 duration-200 space-y-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enterprise Profile details</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDetailModal(false);
                            setActiveVenture(null);
                          }}
                          className="h-8 w-8 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 font-extrabold text-sm"
                        >
                          ✕
                        </button>
                      </div>

                      {detailLoading || !activeVenture ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-center gap-4">
                              <div className="relative h-16 w-16 overflow-hidden rounded-md bg-gray-50 border border-gray-100 shadow-sm shrink-0">
                                <img
                                  src={activeVenture.logo_url || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=150&h=150&fit=crop"}
                                  alt={activeVenture.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{activeVenture.name}</h2>
                                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-extrabold border ${
                                    activeVenture.is_open 
                                      ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" 
                                      : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-755"
                                  }`}>
                                    {activeVenture.is_open ? "Active Now" : "Closed"}
                                  </span>
                                  <span className="rounded bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                    {activeVenture.category}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-400">{activeVenture.tagline}</p>
                                <p className="mt-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                                  Founded by <span className="text-gray-700 dark:text-gray-300 font-bold">{activeVenture.owner_name}</span> ({activeVenture.owner_batch})
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-row items-center gap-3 border-l-0 md:border-l border-gray-150 dark:border-gray-800 pl-0 md:pl-6 shrink-0">
                              <div>
                                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">★ {activeVenture.average_rating}</p>
                                <p className="text-xs font-bold text-gray-400 mt-1">{activeVenture.reviews_count} student reviews</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">About the Venture</h3>
                              <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line bg-gray-50/50 dark:bg-gray-850/50 p-4 rounded-md border border-gray-200 dark:border-gray-800">
                                {activeVenture.description}
                              </p>
                            </div>

                            <div className="space-y-6">
                              {activeVenture.offerings.length > 0 && (
                                <div className="space-y-3">
                                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Our Offerings</h3>
                                  <ul className="space-y-2">
                                    {activeVenture.offerings.map((offering, idx) => (
                                      <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-350">
                                        <span className="text-blue-500 font-bold">✓</span> {offering}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Connect Coordinates</h3>
                                <div className="flex flex-col gap-3">
                                  {activeVenture.contact_links.whatsapp && (
                                    <div className="flex flex-col gap-1.5">
                                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">WhatsApp Contact</span>
                                      <div className="relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3 min-h-[50px] flex flex-col justify-center">
                                        <div className="flex flex-col gap-2">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 select-all">{activeVenture.contact_links.whatsapp}</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                navigator.clipboard.writeText(activeVenture.contact_links.whatsapp || "");
                                                setWhatsappCopied(true);
                                                setTimeout(() => setWhatsappCopied(false), 2000);
                                              }}
                                              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-2.5 py-1 text-[10px] font-black tracking-wider uppercase transition-colors"
                                            >
                                              {whatsappCopied ? "✓ Copied" : "📋 Copy"}
                                            </button>
                                          </div>
                                          <a
                                            href={`https://wa.me/${activeVenture.contact_links.whatsapp.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full text-center bg-green-600 hover:bg-green-700 text-white rounded-md py-1.5 text-[10px] font-black tracking-wider uppercase transition-colors flex items-center justify-center gap-1 shadow-xs"
                                          >
                                            <span>Open WhatsApp</span>
                                            <span>↗</span>
                                          </a>
                                        </div>

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
                                            className={`absolute inset-0 z-10 w-full h-full bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:brightness-105 active:brightness-95 ${
                                              scratchingWhatsapp ? "animate-scratch-wipe pointer-events-none" : ""
                                            }`}
                                          >
                                            <span className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5 animate-pulse">
                                              <span>💬</span>
                                              <span>Reveal WhatsApp</span>
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {activeVenture.contact_links.email && (
                                    <div className="flex flex-col gap-1.5">
                                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Email Contact</span>
                                      <div className="relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3 min-h-[50px] flex flex-col justify-center">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate select-all">{activeVenture.contact_links.email}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(activeVenture.contact_links.email || "");
                                              setEmailCopied(true);
                                              setTimeout(() => setEmailCopied(false), 2000);
                                            }}
                                            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-2.5 py-1 text-[10px] font-black tracking-wider uppercase transition-colors"
                                          >
                                            {emailCopied ? "✓ Copied" : "📋 Copy"}
                                          </button>
                                        </div>

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
                                            className={`absolute inset-0 z-10 w-full h-full bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:brightness-105 active:brightness-95 ${
                                              scratchingEmail ? "animate-scratch-wipe pointer-events-none" : ""
                                            }`}
                                          >
                                            <span className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5 animate-pulse">
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
                                      className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-800 py-2 text-xs font-bold text-white shadow-sm hover:bg-gray-900 transition-colors mt-1"
                                    >
                                      📸 Instagram Profile
                                    </a>
                                  )}
                                  {activeVenture.contact_links.website && (
                                    <a
                                      href={activeVenture.contact_links.website}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                                    >
                                      🌐 Visit Website
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Contact Founder Notice Card */}
                          <div className="bg-blue-50/50 dark:bg-blue-950/15 border-l-4 border-l-blue-600 p-6 rounded-md border-y border-r border-gray-150 dark:border-gray-850 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-black text-gray-900 dark:text-white">Want to discuss collaborations or place custom orders?</h4>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Reuses IIML Connect messaging network. Safe, student-to-student authentication.</p>
                            </div>
                            {activeVenture.owner_id !== currentUserId ? (
                              <Button onClick={handleContactFounder}>Contact Founder</Button>
                            ) : (
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 rounded-md px-2.5 py-1">You own this venture</span>
                            )}
                          </div>

                          {/* Reviews Shelf */}
                          <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Reviews & Ratings</h3>

                            {activeVenture.owner_id !== currentUserId && (() => {
                              const hasSubmittedReview = activeVenture.reviews.some(r => r.reviewer_id === currentUserId) || userReviewedVentureIds.includes(activeVenture.id);
                              if (!hasSubmittedReview) {
                                return (
                                  <form onSubmit={handleReviewSubmit} className="bg-gray-50 dark:bg-gray-950/20 p-4 rounded-md border border-gray-200 dark:border-gray-800 space-y-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-605 dark:text-gray-405">Rate this startup:</span>
                                      <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            type="button"
                                            key={star}
                                            disabled={reviewSubmitting}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(null)}
                                            className={`text-2xl focus:outline-none transition-all duration-150 hover:scale-125 active:scale-95 ${
                                              (hoverRating !== null ? hoverRating >= star : rating >= star)
                                                ? "text-amber-500 scale-105"
                                                : "text-gray-300 dark:text-gray-700"
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                                      disabled={reviewSubmitting}
                                    />

                                    {reviewError && (
                                      <p className="text-xs font-bold text-red-650 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-md border border-red-100 dark:border-red-900/30">
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
                                  <div className="bg-green-50/50 dark:bg-green-950/10 border border-green-150 dark:border-green-900/30 p-4 rounded-md text-center space-y-1">
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
                                  <div key={review.id} className="border-b border-gray-150 dark:border-gray-800 pb-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-xs font-extrabold text-gray-900 dark:text-white">{review.reviewer_name}</p>
                                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">{review.reviewer_batch}</p>
                                      </div>
                                      <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                        {"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}
                                      </span>
                                    </div>
                                    {review.content && (
                                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50/20 dark:bg-gray-900/40 p-2 rounded-md border border-gray-150 dark:border-gray-800">
                                        {review.content}
                                      </p>
                                    )}
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right">
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
      </div>

      {/* First Review Success Modal */}
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
              className="relative bg-white dark:bg-gray-900 rounded-md p-8 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-800 text-center space-y-6 animate-in zoom-in-95 duration-300"
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0,
                transition: { type: "spring", stiffness: 400, damping: 28 } }}
              exit={{ opacity: 0, scale: 0.92, y: 12,
                transition: { duration: 0.18, ease: "easeIn" } }}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-500 border border-blue-100 dark:border-blue-900/30 shadow-sm animate-bounce">
                <span className="text-3xl">⭐️</span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-white">🎉 Milestone Unlocked!</h3>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">First Review Submitted</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed pt-2">
                  Congratulations! You have successfully submitted your **first review** on the IIM Lucknow Venture Hub.
                </p>
                <p className="text-xs text-gray-405 dark:text-gray-450 leading-relaxed bg-gray-50 dark:bg-gray-950/50 p-3 rounded-md border border-gray-150 dark:border-gray-850">
                  Your ratings and feedback help student startups improve their offerings, build credibility, and gain traction on campus. Keep supporting student founders!
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFirstReviewSuccess(false)}
                className="w-full rounded-md bg-blue-600 px-5 py-3 text-xs font-black text-white hover:bg-blue-700 shadow-md transition-colors"
              >
                Awesome! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
