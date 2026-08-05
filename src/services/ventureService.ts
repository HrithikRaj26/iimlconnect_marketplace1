import { supabase } from "@/lib/supabase";
import { Venture, VentureReview, VenturePost, UserBadge, VentureCategory, VentureStatus } from "@/types";

export interface IVentureService {
  getVentures(filters: { query?: string; category?: string; sort?: "popular" | "newest" }): Promise<Venture[]>;
  getVentureById(id: string): Promise<Venture & { reviews: VentureReview[] }>;
  getMyVentures(): Promise<Venture[]>;
  createVenture(data: {
    name: string;
    tagline: string;
    description: string;
    category: VentureCategory;
    logo_url?: string;
    offerings: string[];
    contact_links: {
      website?: string;
      instagram?: string;
      whatsapp?: string;
      email?: string;
    };
    terms_accepted?: boolean;
  }): Promise<Venture>;
  updateVenture(id: string, data: Partial<VerveEditData>): Promise<Venture>;
  deleteVenture(id: string): Promise<void>;
  submitReview(ventureId: string, rating: number, content: string): Promise<VentureReview>;
  getFeedPosts(sort?: "chronological" | "trending"): Promise<VenturePost[]>;
  createPost(data: {
    ventureId: string;
    type: "event" | "promotion" | "update";
    title: string;
    content: string;
    eventDate?: string;
    eventLocation?: string;
  }): Promise<VenturePost>;
  toggleLikePost(postId: string, currentlyLiked: boolean): Promise<{ likes: number; isLiked: boolean }>;
  getUserBadges(userId?: string): Promise<UserBadge[]>;
  getLeaderboards(): Promise<{ topVentures: Venture[]; topContributors: any[] }>;
  getAdminStats(): Promise<{
    totals: { registrations: number; activeUsers: number; totalReviews: number; totalPosts: number };
    registrationsOverTime: { date: string; count: number }[];
    categoryDistribution: { category: string; count: number }[];
    pendingQueue: Venture[];
  }>;
  updateVentureStatus(id: string, status: "approved" | "rejected"): Promise<void>;
  payVentureDue(id: string): Promise<void>;
  toggleVentureOpenStatus(id: string, isOpen: boolean): Promise<Venture>;
}

interface VerveEditData {
  name: string;
  tagline: string;
  description: string;
  category: VentureCategory;
  logo_url?: string;
  offerings: string[];
  contact_links: {
    website?: string;
    instagram?: string;
    whatsapp?: string;
    email?: string;
  };
  status: VentureStatus;
}

class SupabaseVentureService implements IVentureService {
  async getVentures(filters: { query?: string; category?: string; sort?: "popular" | "newest" }): Promise<Venture[]> {
    let query = supabase.from("ventures").select("*").eq("status", "approved");

    if (filters.category && filters.category !== "All") {
      query = query.eq("category", filters.category);
    }

    if (filters.query) {
      query = query.or(`name.ilike.%${filters.query}%,tagline.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const ventures = data as Venture[];

    if (filters.sort === "popular") {
      // sort by score: average_rating * log(reviews_count + 1) or simply average_rating desc, reviews_count desc
      return ventures.sort((a, b) => {
        if (b.average_rating !== a.average_rating) {
          return Number(b.average_rating) - Number(a.average_rating);
        }
        return b.reviews_count - a.reviews_count;
      });
    } else {
      // default to newest
      return ventures.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  async getVentureById(id: string): Promise<Venture & { reviews: VentureReview[] }> {
    const { data: venture, error: vError } = await supabase.from("ventures").select("*").eq("id", id).single();
    if (vError) throw new Error(vError.message);

    const { data: reviews, error: rError } = await supabase
      .from("reviews")
      .select("*")
      .eq("venture_id", id)
      .order("created_at", { ascending: false });
    if (rError) throw new Error(rError.message);

    return {
      ...(venture as Venture),
      reviews: reviews as VentureReview[],
    };
  }

  async getMyVentures(): Promise<Venture[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return [];

    const { data, error } = await supabase
      .from("ventures")
      .select("*")
      .eq("owner_id", sessionData.session.user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return data as Venture[];
  }

  async createVenture(data: {
    name: string;
    tagline: string;
    description: string;
    category: VentureCategory;
    logo_url?: string;
    offerings: string[];
    contact_links: {
      website?: string;
      instagram?: string;
      whatsapp?: string;
      email?: string;
    };
    terms_accepted?: boolean;
  }): Promise<Venture> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error("Authentication required.");

    const user = sessionData.session.user;
    const metadata = user.user_metadata || {};
    const ownerName = metadata.full_name || metadata.name || "Student";
    const ownerBatch = "PGP " + (new Date().getFullYear() - 1) + "-" + (new Date().getFullYear() + 1);

    // Limit check: max 3 ventures
    const myVentures = await this.getMyVentures();
    if (myVentures.length >= 3) {
      throw new Error("Maximum cap reached. You can only create up to 3 ventures.");
    }

    const insertData = {
      owner_id: user.id,
      name: data.name.trim(),
      tagline: data.tagline.trim(),
      description: data.description.trim(),
      category: data.category,
      logo_url: data.logo_url || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=150&h=150&fit=crop",
      offerings: data.offerings,
      contact_links: data.contact_links,
      status: "pending_approval", // New ventures require moderation approval
      is_featured: false,
      average_rating: 0.00,
      reviews_count: 0,
      owner_name: ownerName,
      owner_batch: ownerBatch,
      is_open: false,
      terms_accepted: data.terms_accepted || false,
      current_due: 0.00,
    };

    const { data: newVenture, error } = await supabase
      .from("ventures")
      .insert([insertData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return newVenture as Venture;
  }

  async updateVenture(id: string, data: Partial<VerveEditData>): Promise<Venture> {
    const { data: updated, error } = await supabase
      .from("ventures")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Badge logic check: if updated status is approved, check Serial Entrepreneur badge
    if (data.status === "approved") {
      await this.checkAndGrantSerialEntrepreneur(updated.owner_id);
    }

    return updated as Venture;
  }

  async toggleVentureOpenStatus(id: string, isOpen: boolean): Promise<Venture> {
    const { data, error } = await supabase
      .from("ventures")
      .update({ is_open: isOpen })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Venture;
  }

  async deleteVenture(id: string): Promise<void> {
    const { error } = await supabase.from("ventures").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async submitReview(ventureId: string, rating: number, content: string): Promise<VentureReview> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error("Authentication required to write a review.");

    const user = sessionData.session.user;
    const metadata = user.user_metadata || {};
    const reviewerName = metadata.full_name || metadata.name || "Student";
    const reviewerBatch = "PGP " + (new Date().getFullYear() - 1) + "-" + (new Date().getFullYear() + 1);

    // Prevent reviewing own venture
    const { data: venture } = await supabase.from("ventures").select("owner_id").eq("id", ventureId).single();
    if (venture && venture.owner_id === user.id) {
      throw new Error("You cannot submit a review for your own venture!");
    }

    const insertData = {
      venture_id: ventureId,
      reviewer_id: user.id,
      rating,
      content: content.trim(),
      reviewer_name: reviewerName,
      reviewer_batch: reviewerBatch,
    };

    const { data: review, error } = await supabase
      .from("reviews")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("You have already reviewed this venture! Only one review per student is allowed.");
      }
      throw new Error(error.message);
    }

    // Update venture average rating aggregates
    const { data: reviews } = await supabase.from("reviews").select("rating").eq("venture_id", ventureId);
    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await supabase
        .from("ventures")
        .update({
          average_rating: parseFloat(avg.toFixed(2)),
          reviews_count: reviews.length
        })
        .eq("id", ventureId);
    }

    // Trigger Gamification badge checks
    await this.checkAndGrantTopReviewer(user.id);
    await this.checkAndGrantActiveSupporter(user.id);

    return review as VentureReview;
  }

  async getFeedPosts(sort: "chronological" | "trending" = "chronological"): Promise<VenturePost[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    // We join the posts table with venture name and logo
    const { data, error } = await supabase
      .from("posts")
      .select("*, venture:ventures(name, logo_url, category)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    let posts = data as VenturePost[];

    // Fetch user liked post IDs to flag isLiked
    if (userId && posts.length > 0) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId);
      
      if (likes) {
        const likedSet = new Set(likes.map(l => l.post_id));
        posts = posts.map(p => ({
          ...p,
          isLiked: likedSet.has(p.id)
        }));
      }
    }

    if (sort === "trending") {
      // Sort formula: likes * 3 + shares * 5 + weight based on recency
      return posts.sort((a, b) => {
        const scoreA = (a.likes || 0) * 3 + (a.shares || 0) * 5;
        const scoreB = (b.likes || 0) * 3 + (b.shares || 0) * 5;
        return scoreB - scoreA;
      });
    }

    return posts;
  }

  async createPost(data: {
    ventureId: string;
    type: "event" | "promotion" | "update";
    title: string;
    content: string;
    eventDate?: string;
    eventLocation?: string;
  }): Promise<VenturePost> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error("Authentication required.");

    const insertData = {
      venture_id: data.ventureId,
      author_id: sessionData.session.user.id,
      type: data.type,
      title: data.title.trim(),
      content: data.content.trim(),
      event_date: data.eventDate || null,
      event_location: data.eventLocation || null,
      likes: 0,
      shares: 0,
    };

    const { data: newPost, error } = await supabase
      .from("posts")
      .insert([insertData])
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Fetch venture details to append
    const { data: venture } = await supabase
      .from("ventures")
      .select("name, logo_url, category")
      .eq("id", data.ventureId)
      .single();

    return {
      ...newPost,
      venture: venture ? {
        name: venture.name,
        logo_url: venture.logo_url,
        category: venture.category
      } : undefined
    } as VenturePost;
  }

  async toggleLikePost(postId: string, currentlyLiked: boolean): Promise<{ likes: number; isLiked: boolean }> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error("Authentication required.");
    const userId = sessionData.session.user.id;

    if (currentlyLiked) {
      // Unlike
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
      const { data: post } = await supabase.from("posts").select("likes").eq("id", postId).single();
      const nextLikes = Math.max(0, (post?.likes || 1) - 1);
      await supabase.from("posts").update({ likes: nextLikes }).eq("id", postId);
      return { likes: nextLikes, isLiked: false };
    } else {
      // Like
      await supabase.from("post_likes").insert([{ post_id: postId, user_id: userId }]);
      const { data: post } = await supabase.from("posts").select("likes").eq("id", postId).single();
      const nextLikes = (post?.likes || 0) + 1;
      await supabase.from("posts").update({ likes: nextLikes }).eq("id", postId);
      
      // Trigger Gamification active supporter check
      await this.checkAndGrantActiveSupporter(userId);

      return { likes: nextLikes, isLiked: true };
    }
  }

  async getUserBadges(userId?: string): Promise<UserBadge[]> {
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: sessionData } = await supabase.auth.getSession();
      targetUserId = sessionData.session?.user?.id;
    }
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_id", targetUserId)
      .order("granted_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as UserBadge[];
  }

  async getLeaderboards(): Promise<{ topVentures: Venture[]; topContributors: any[] }> {
    // 1. Get Top Ventures sorted by score: rating * log(reviews_count + 1)
    const { data: ventures } = await supabase.from("ventures").select("*").eq("status", "approved");
    const sortedVentures = (ventures as Venture[] || [])
      .sort((a, b) => b.average_rating * Math.log2(b.reviews_count + 1) - a.average_rating * Math.log2(a.reviews_count + 1))
      .slice(0, 10);

    // 2. Get Top Contributors based on badge counts and review logs
    // Since we don't have a direct grouping on auth.users from client-side easily without admin APIs,
    // we can dynamically aggregate contributors from reviews and user_badges table.
    const { data: reviews } = await supabase.from("reviews").select("reviewer_name, reviewer_batch, reviewer_id");
    const { data: badges } = await supabase.from("user_badges").select("user_id");

    const contributorMap: Record<string, { name: string; batch: string; reviewsCount: number; badgeCount: number; score: number }> = {};

    reviews?.forEach(r => {
      if (!contributorMap[r.reviewer_id]) {
        contributorMap[r.reviewer_id] = {
          name: r.reviewer_name,
          batch: r.reviewer_batch,
          reviewsCount: 0,
          badgeCount: 0,
          score: 0,
        };
      }
      contributorMap[r.reviewer_id].reviewsCount += 1;
    });

    badges?.forEach(b => {
      if (contributorMap[b.user_id]) {
        contributorMap[b.user_id].badgeCount += 1;
      }
    });

    const contributors = Object.values(contributorMap)
      .map(c => ({
        ...c,
        score: c.reviewsCount * 10 + c.badgeCount * 50
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      topVentures: sortedVentures,
      topContributors: contributors,
    };
  }

  async getAdminStats(): Promise<{
    totals: { registrations: number; activeUsers: number; totalReviews: number; totalPosts: number };
    registrationsOverTime: { date: string; count: number }[];
    categoryDistribution: { category: string; count: number }[];
    pendingQueue: Venture[];
  }> {
    const [{ count: regCount }, { data: ventures }] = await Promise.all([
      supabase.from("ventures").select("*", { count: "exact", head: true }),
      supabase.from("ventures").select("*"),
    ]);

    const { count: reviewCount } = await supabase.from("reviews").select("*", { count: "exact", head: true });
    const { count: postCount } = await supabase.from("posts").select("*", { count: "exact", head: true });

    const activeUsers = new Set((ventures || []).map(v => v.owner_id)).size;

    // Compute category distribution
    const categoriesMap: Record<string, number> = {};
    (ventures || []).forEach(v => {
      if (v.status === "approved") {
        categoriesMap[v.category] = (categoriesMap[v.category] || 0) + 1;
      }
    });
    const categoryDistribution = Object.entries(categoriesMap).map(([category, count]) => ({
      category,
      count
    }));

    // Compute registrations over time (group by day/week)
    const datesMap: Record<string, number> = {};
    (ventures || []).forEach(v => {
      const d = new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      datesMap[d] = (datesMap[d] || 0) + 1;
    });
    const registrationsOverTime = Object.entries(datesMap).map(([date, count]) => ({
      date,
      count
    })).reverse().slice(-7); // Last 7 days

    const pendingQueue = (ventures || []).filter(v => v.status === "pending_approval") as Venture[];

    return {
      totals: {
        registrations: regCount || 0,
        activeUsers: activeUsers || 0,
        totalReviews: reviewCount || 0,
        totalPosts: postCount || 0,
      },
      registrationsOverTime,
      categoryDistribution,
      pendingQueue,
    };
  }

  async updateVentureStatus(id: string, status: "approved" | "rejected"): Promise<void> {
    const updateObj: any = { status };
    if (status === "approved") {
      updateObj.approved_at = new Date().toISOString();
    }
    
    const { data: updated, error } = await supabase
      .from("ventures")
      .update(updateObj)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If approved, trigger Serial Entrepreneur badge checks and trigger Resend email route
    if (status === "approved" && updated) {
      await this.checkAndGrantSerialEntrepreneur(updated.owner_id);

      const studentEmail = updated.contact_links?.email || `${updated.owner_name.toLowerCase().replace(/\s+/g, '')}@iiml.ac.in`;

      try {
        await fetch("/api/ventures/approve-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ventureName: updated.name,
            ownerName: updated.owner_name,
            recipientEmail: studentEmail,
          }),
        });
        console.log(`📧 Congratulatory email triggered for "${updated.name}" to ${studentEmail}`);
      } catch (err) {
        console.error("Failed to send approval email via API route:", err);
      }
    }
  }

  async payVentureDue(id: string): Promise<void> {
    const { error } = await supabase
      .from("ventures")
      .update({ current_due: 0.00, status: "approved" })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  // ── Deterministic Badge Award System ────────────────────────────────────────

  private async checkAndGrantTopReviewer(userId: string): Promise<void> {
    // Top Reviewer: Review count >= 3
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("reviewer_id", userId);

    if (count !== null && count >= 3) {
      await this.grantBadge(userId, "top_reviewer", "Submitted 3 or more high-quality reviews for student ventures.");
    }
  }

  private async checkAndGrantSerialEntrepreneur(userId: string): Promise<void> {
    // Serial Entrepreneur: Published approved ventures >= 2
    const { count } = await supabase
      .from("ventures")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("status", "approved");

    if (count !== null && count >= 2) {
      await this.grantBadge(userId, "serial_entrepreneur", "Successfully launched and published 2 or more student ventures on the hub.");
    }
  }

  private async checkAndGrantActiveSupporter(userId: string): Promise<void> {
    // Active Supporter: Review count >= 1 AND likes count >= 3
    const [{ count: revCount }, { count: likeCount }] = await Promise.all([
      supabase.from("reviews").select("*", { count: "exact", head: true }).eq("reviewer_id", userId),
      supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("user_id", userId)
    ]);

    if (revCount !== null && revCount >= 1 && likeCount !== null && likeCount >= 3) {
      await this.grantBadge(userId, "active_supporter", "Actively supporting the community by reviewing ventures and liking at least 3 feed posts.");
    }
  }

  private async grantBadge(userId: string, badgeType: string, reason: string): Promise<void> {
    try {
      // This uses upsert / ignore on duplicate via PostgreSQL unique constraint
      await supabase.from("user_badges").insert([
        {
          user_id: userId,
          badge_type: badgeType,
          reason: reason
        }
      ]);
    } catch (e) {
      // Ignored if they already have the badge (unique constraint duplicate error)
    }
  }
}

export const ventureService: IVentureService = new SupabaseVentureService();
