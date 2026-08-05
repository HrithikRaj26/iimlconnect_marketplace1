"use client";

import React, { useEffect, useState } from "react";
import { ventureService } from "@/services/ventureService";
import { Venture, VenturePost } from "@/types";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TextInput } from "@/components/ui/TextInput";
import { supabase } from "@/lib/supabase";

export default function CommunityFeed() {
  const [posts, setPosts] = useState<VenturePost[]>([]);
  const [myVentures, setMyVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"chronological" | "trending">("chronological");
  
  // Post wizard state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVentureId, setSelectedVentureId] = useState("");
  const [postType, setPostType] = useState<"event" | "promotion" | "update">("update");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [activeEvent, setActiveEvent] = useState<VenturePost | null>(null);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const feedData = await ventureService.getFeedPosts(sortOrder);
      setPosts(feedData);

      // Check if user owns approved ventures to allow posting
      const myData = await ventureService.getMyVentures();
      const approvedOnly = myData.filter((v) => v.status === "approved");
      setMyVentures(approvedOnly);
      if (approvedOnly.length > 0) {
        setSelectedVentureId(approvedOnly[0].id);
      }
    } catch (e) {
      console.error("Error loading feed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [sortOrder]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    // Optimistic UI updates
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !isLiked,
            likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1
          };
        }
        return p;
      })
    );

    try {
      await ventureService.toggleLikePost(postId, isLiked);
    } catch (err) {
      console.error("Error liking post:", err);
      // Revert if error occurs
      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: isLiked,
              likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
            };
          }
          return p;
        })
      );
    }
  };

  const handleShare = (post: VenturePost) => {
    const shareText = `Check out this broadcast from ${post.venture?.name} on IIML Connect: "${post.title}" - ${post.content}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      alert("Post details copied to clipboard!");
    } else {
      alert(shareText);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVentureId) return;

    setFormSubmitting(true);
    setFormError("");

    try {
      const newPost = await ventureService.createPost({
        ventureId: selectedVentureId,
        type: postType,
        title,
        content,
        eventDate: postType === "event" ? eventDate : undefined,
        eventLocation: postType === "event" ? eventLocation : undefined
      });

      setPosts([newPost, ...posts]);
      setShowCreateModal(false);
      setTitle("");
      setContent("");
      setEventDate("");
      setEventLocation("");
    } catch (err: any) {
      setFormError(err.message || "Failed to broadcast post.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const formatPostType = (type: string) => {
    switch (type) {
      case "event": return "📅 Event";
      case "promotion": return "🎉 Promotion";
      case "update": return "📢 Update";
      default: return type;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "event": return "bg-blue-50 text-blue-700 border-blue-100";
      case "promotion": return "bg-green-50 text-green-700 border-green-100";
      case "update": return "bg-purple-50 text-purple-700 border-purple-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header filter actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => setSortOrder("chronological")}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
              sortOrder === "chronological" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Chronological
          </button>
          <button
            onClick={() => setSortOrder("trending")}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
              sortOrder === "trending" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Trending Feed
          </button>
        </div>

        {myVentures.length > 0 ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-black text-white hover:bg-gray-800 transition-colors"
          >
            📢 Broadcast an Update
          </button>
        ) : (
          <p className="text-xs font-semibold text-gray-400 italic">
            *Register and approve a venture to broadcast on this feed.
          </p>
        )}
      </div>

      {/* Main Feed Content */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white p-6 border border-gray-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-16 w-full bg-gray-200 rounded" />
              <div className="h-8 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 py-16 px-6 text-center">
          <span className="text-5xl">💬</span>
          <h3 className="mt-4 text-lg font-bold text-gray-900">Feed is Empty</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-xs">
            Startups haven't posted any updates yet. Broadcasts will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const isLiked = !!post.isLiked;
            return (
              <div key={post.id} className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm space-y-4">
                {/* Venture Profile Details */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-50 border border-gray-100 shrink-0">
                      <img
                        src={post.venture?.logo_url || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=150&h=150&fit=crop"}
                        alt={post.venture?.name || "Venture"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900">{post.venture?.name}</h4>
                      <p className="text-[10px] font-semibold text-gray-400">
                        {post.venture?.category} · {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span className={`rounded px-2 py-0.5 text-[10px] font-extrabold border ${getPostTypeColor(post.type)}`}>
                    {formatPostType(post.type)}
                  </span>
                </div>

                {/* Content Block */}
                <div className="space-y-2">
                  <h3 className="text-base font-black text-gray-900">{post.title}</h3>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Event metadata */}
                {post.type === "event" && (post.event_date || post.event_location) && (
                  <div className="rounded-xl border border-blue-50 bg-blue-50/20 p-4 space-y-2">
                    <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">Event Coordinates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold text-gray-600">
                      {post.event_date && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📅</span>
                          <span>{new Date(post.event_date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      )}
                      {post.event_location && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📍</span>
                          <span>{post.event_location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setActiveEvent(post)}
                        className="text-xs font-extrabold text-blue-600 hover:text-blue-700 focus:outline-none"
                      >
                        View Full Details →
                      </button>
                    </div>
                  </div>
                )}

                {/* Interaction Footer */}
                <div className="flex items-center gap-6 border-t border-gray-100 pt-4">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post.id, isLiked)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-all focus:outline-none active:scale-125 ${
                      isLiked ? "text-red-500 animate-heart" : "text-gray-400 hover:text-red-400"
                    }`}
                  >
                    <span className="text-lg">{isLiked ? "❤️" : "🤍"}</span>
                    <span>{post.likes || 0} Likes</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <span className="text-lg">🔗</span>
                    <span>Share Broadcast</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-extrabold text-gray-900">📢 Create Broadcast Post</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-500 font-extrabold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              {/* Select Venture */}
              {myVentures.length > 1 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Post on behalf of:</label>
                  <select
                    value={selectedVentureId}
                    onChange={(e) => setSelectedVentureId(e.target.value)}
                    className="appearance-none block w-full rounded-xl border border-gray-200 pl-3 pr-10 py-2.5 text-sm font-bold text-gray-800 outline-none focus:border-orange-500 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%25234b5563%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-[size:1.1rem_1.1rem] bg-no-repeat"
                  >
                    {myVentures.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Select Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Broadcast Category:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["update", "promotion", "event"] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setPostType(type)}
                      className={`rounded-xl border py-2 text-center text-xs font-bold uppercase transition-all ${
                        postType === type
                          ? "bg-gray-900 border-gray-900 text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {type === "event" ? "📅 Event" : type === "promotion" ? "🎉 Promo" : "📢 Update"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <TextInput
                label="Broadcast Title"
                placeholder="e.g. Mid-term special Combo deal, Launching MVPs..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* Content */}
              <TextArea
                label="Message Content"
                placeholder="What details would you like to share with the community?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
              />

              {/* Event Coordinates */}
              {postType === "event" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-150 animate-in slide-in-from-top-2 duration-150">
                  <TextInput
                    label="Date & Time"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                  <TextInput
                    label="Location"
                    placeholder="e.g. Samanvaya Hall, Hostel B"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    required
                  />
                </div>
              )}

              {formError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  ⚠️ {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={formSubmitting}>
                  Broadcast Post
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details modal */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-extrabold text-blue-900">📅 Scheduled Event details</h3>
              <button
                onClick={() => setActiveEvent(null)}
                className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-500 font-extrabold text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={activeEvent.venture?.logo_url || ''}
                  className="h-10 w-10 rounded-lg object-cover bg-gray-50 border"
                />
                <div>
                  <h4 className="text-sm font-black text-gray-900">{activeEvent.venture?.name}</h4>
                  <p className="text-[10px] font-semibold text-gray-400">Host Startup</p>
                </div>
              </div>
              <h3 className="text-base font-black text-gray-900 mt-2">{activeEvent.title}</h3>
              <p className="text-xs font-medium text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                {activeEvent.content}
              </p>
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <span className="text-lg">📅</span>
                  <div className="flex flex-col">
                    <span className="font-extrabold">Date & Time</span>
                    <span className="text-gray-500">{new Date(activeEvent.event_date!).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 pt-1">
                  <span className="text-lg">📍</span>
                  <div className="flex flex-col">
                    <span className="font-extrabold">Venue/Location</span>
                    <span className="text-gray-500">{activeEvent.event_location}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setActiveEvent(null)}>Close details</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
