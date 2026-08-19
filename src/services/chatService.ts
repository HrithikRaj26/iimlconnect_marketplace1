import { ChatMessage, Offer, Conversation } from "@/types";
import { supabase } from "@/lib/supabase";

export interface IChatService {
  getConversations(): Promise<Conversation[]>;
  getMessages(conversationId: string): Promise<ChatMessage[]>;
  sendMessage(conversationId: string, text: string): Promise<{ deliveredAt: number }>;
  sendOffer(conversationId: string, amount: number, note?: string): Promise<{ offer: Offer }>;
  respondToOffer(
    conversationId: string,
    offerId: string,
    action: "accept" | "decline"
  ): Promise<{ ok: true }>;
  createOrGetConversation(params: {
    id: string;
    buyerId: string;
    buyerName: string;
    buyerBatch: string;
    sellerId: string;
    sellerName: string;
    sellerBatch: string;
    listingId: string;
    listingType: "item" | "venture";
    listingTitle: string;
    listingImage: string;
    listingAskingPrice: number;
  }): Promise<Conversation>;
  markAsRead(conversationId: string): Promise<void>;
}

class SupabaseChatService implements IChatService {
  private async getSessionUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session. Please log in.");
    return session.user;
  }

  async getConversations(): Promise<Conversation[]> {
    const user = await this.getSessionUser();
    const currentUserId = user.id;

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }

    const items: Conversation[] = [];

    for (const row of (data || [])) {
      const isBuyer = row.buyer_id === currentUserId;
      const participant = {
        id: isBuyer ? row.seller_id : row.buyer_id,
        name: isBuyer ? row.seller_name : row.buyer_name,
        batch: isBuyer ? row.seller_batch : row.buyer_batch,
        online: true,
        verified: true,
        avatarColor: isBuyer ? "#D97706" : "#2563EB"
      };

      // Fetch message thread
      const { data: msgRows } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", row.id)
        .order("created_at", { ascending: true });

      // Count unread messages (sender != currentUserId and is_read = false)
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", row.id)
        .neq("sender_id", currentUserId)
        .eq("is_read", false);

      const unreadCount = count || 0;

      const mappedMessages: ChatMessage[] = (msgRows || []).map(m => ({
        id: m.id,
        kind: m.kind as "text" | "offer",
        authorId: m.sender_id === currentUserId ? "me" : m.sender_id,
        createdAt: new Date(m.created_at).getTime(),
        status: "delivered",
        text: m.text_content || undefined,
        offer: m.kind === "offer" ? {
          id: m.id,
          amount: Number(m.offer_amount),
          status: m.offer_status as any,
          direction: m.sender_id === currentUserId ? "sent" : "received",
          createdAt: new Date(m.created_at).getTime(),
          note: m.offer_note || undefined
        } : undefined
      }));

      items.push({
        id: row.id,
        participant,
        listing: {
          id: row.listing_id,
          title: row.listing_title,
          askingPrice: Number(row.listing_asking_price),
          imageUrl: row.listing_image
        },
        lastMessagePreview: row.last_message_preview,
        lastMessageAt: new Date(row.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount,
        messages: mappedMessages,
        transaction: {
          status: row.status as any,
          finalAmount: row.final_amount ? Number(row.final_amount) : undefined,
          pickupLocation: row.pickup_location || undefined,
          pickupTime: row.pickup_time || undefined
        }
      });
    }

    return items;
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const user = await this.getSessionUser();
    const currentUserId = user.id;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data || []).map(m => ({
      id: m.id,
      kind: m.kind as "text" | "offer",
      authorId: m.sender_id === currentUserId ? "me" : m.sender_id,
      createdAt: new Date(m.created_at).getTime(),
      status: "delivered",
      text: m.text_content || undefined,
      offer: m.kind === "offer" ? {
        id: m.id,
        amount: Number(m.offer_amount),
        status: m.offer_status as any,
        direction: m.sender_id === currentUserId ? "sent" : "received",
        createdAt: new Date(m.created_at).getTime(),
        note: m.offer_note || undefined
      } : undefined
    }));
  }

  async sendMessage(conversationId: string, text: string): Promise<{ deliveredAt: number }> {
    await this.ensureConversationExists(conversationId);
    const user = await this.getSessionUser();
    const currentUserId = user.id;
    const msgId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const nowStr = new Date().toISOString();

    // 1. Insert message
    let { error: msgErr } = await supabase
      .from("messages")
      .insert({
        id: msgId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        created_at: nowStr,
        kind: "text",
        text_content: text,
        is_read: false
      });

    if (msgErr && (msgErr.message?.includes("is_read") || msgErr.code === "PGRST204")) {
      const { error: retryErr } = await supabase
        .from("messages")
        .insert({
          id: msgId,
          conversation_id: conversationId,
          sender_id: currentUserId,
          created_at: nowStr,
          kind: "text",
          text_content: text
        });
      msgErr = retryErr;
    }

    if (msgErr) throw msgErr;

    // 2. Update conversation preview
    const { error: convErr } = await supabase
      .from("conversations")
      .update({
        last_message_preview: text,
        last_message_at: nowStr
      })
      .eq("id", conversationId);

    if (convErr) throw convErr;

    return { deliveredAt: Date.now() };
  }

  async sendOffer(conversationId: string, amount: number, note?: string): Promise<{ offer: Offer }> {
    await this.ensureConversationExists(conversationId);
    const user = await this.getSessionUser();
    const currentUserId = user.id;
    const msgId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const nowStr = new Date().toISOString();
    const preview = `Sent a price offer of ₹${amount}`;

    // 0. Mark all prior pending offers in this conversation as "countered"
    // so that stale Accept/Decline buttons disappear on both users' screens.
    // Only the most recent offer should be actionable at any time.
    try {
      await supabase
        .from("messages")
        .update({ offer_status: "countered" })
        .eq("conversation_id", conversationId)
        .eq("kind", "offer")
        .eq("offer_status", "pending");
    } catch (e) {
      console.warn("Could not mark prior offers as countered:", e);
    }

    // 1. Insert offer message
    let { error: msgErr } = await supabase
      .from("messages")
      .insert({
        id: msgId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        created_at: nowStr,
        kind: "offer",
        text_content: preview,
        offer_amount: amount,
        offer_status: "pending",
        offer_note: note || null,
        is_read: false
      });

    if (msgErr && (msgErr.message?.includes("is_read") || msgErr.code === "PGRST204")) {
      const { error: retryErr } = await supabase
        .from("messages")
        .insert({
          id: msgId,
          conversation_id: conversationId,
          sender_id: currentUserId,
          created_at: nowStr,
          kind: "offer",
          text_content: preview,
          offer_amount: amount,
          offer_status: "pending",
          offer_note: note || null
        });
      msgErr = retryErr;
    }

    if (msgErr) throw msgErr;

    // 2. Update conversation preview
    const { error: convErr } = await supabase
      .from("conversations")
      .update({
        last_message_preview: preview,
        last_message_at: nowStr
      })
      .eq("id", conversationId);

    if (convErr) throw convErr;

    return {
      offer: {
        id: msgId,
        amount,
        status: "pending",
        direction: "sent",
        createdAt: Date.now(),
        note
      }
    };
  }

  async respondToOffer(
    conversationId: string,
    offerId: string,
    action: "accept" | "decline"
  ): Promise<{ ok: true }> {
    const user = await this.getSessionUser();
    const nextStatus = action === "accept" ? "accepted" : "declined";

    // 1. Update message
    const { data: msgData, error: msgErr } = await supabase
      .from("messages")
      .update({ offer_status: nextStatus })
      .eq("id", offerId)
      .select()
      .single();

    if (msgErr) throw msgErr;

    const previewText = `Offer was ${nextStatus} (₹${msgData.offer_amount})`;

    // 2. Update conversation
    const updatePayload: any = {
      last_message_preview: previewText,
      last_message_at: new Date().toISOString()
    };

    if (action === "accept") {
      updatePayload.status = "agreed";
      updatePayload.final_amount = msgData.offer_amount;
      updatePayload.pickup_location = "Hostel Block B, Room 405-A";
      updatePayload.pickup_time = "Today, 6:00 PM – 8:00 PM";
    }

    const { error: convErr } = await supabase
      .from("conversations")
      .update(updatePayload)
      .eq("id", conversationId);

    if (convErr) throw convErr;

    // ── On accept: mark the underlying listing as sold ──────────────────────
    // This removes the item from the marketplace search feed automatically.
    // We look up the conversation row to know which listing (and which table)
    // to mark. `listing_type` is either "item" (marketplace listing) or
    // "venture" (venture — we don't mark those sold).
    if (action === "accept") {
      try {
        const { data: convRow } = await supabase
          .from("conversations")
          .select("listing_id, listing_type")
          .eq("id", conversationId)
          .single();

        if (convRow?.listing_type === "item" && convRow.listing_id) {
          // Best-effort: `status` column is added by migration
          // marketplace_migration_005_listing_status_and_realtime.sql
          const { error: soldErr } = await supabase
            .from("listings")
            .update({ status: "sold" })
            .eq("id", convRow.listing_id);
          if (soldErr) {
            console.warn(
              "Could not mark listing as sold (status column may be missing — run migration 005):",
              soldErr
            );
          }
        }
      } catch (e) {
        console.warn("Failed to mark listing as sold:", e);
      }
    }

    return { ok: true };
  }

  async createOrGetConversation(params: {
    id: string;
    buyerId: string;
    buyerName: string;
    buyerBatch: string;
    sellerId: string;
    sellerName: string;
    sellerBatch: string;
    listingId: string;
    listingType: "item" | "venture";
    listingTitle: string;
    listingImage: string;
    listingAskingPrice: number;
  }): Promise<Conversation> {
    const { data: existing, error: findErr } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", params.id)
      .single();

    if (existing) {
      const conversationsList = await this.getConversations();
      const found = conversationsList.find(c => c.id === params.id);
      if (found) return found;
    }

    const nowStr = new Date().toISOString();
    const { error: insErr } = await supabase
      .from("conversations")
      .insert({
        id: params.id,
        created_at: nowStr,
        buyer_id: params.buyerId,
        buyer_name: params.buyerName,
        buyer_batch: params.buyerBatch,
        seller_id: params.sellerId,
        seller_name: params.sellerName,
        seller_batch: params.sellerBatch,
        listing_id: params.listingId,
        listing_type: params.listingType,
        listing_title: params.listingTitle,
        listing_image: params.listingImage,
        listing_asking_price: params.listingAskingPrice,
        status: "negotiating",
        last_message_preview: "Click to chat with the founder",
        last_message_at: nowStr
      });

    if (insErr) throw insErr;

    const conversationsList = await this.getConversations();
    const found = conversationsList.find(c => c.id === params.id);
    if (found) return found;
    throw new Error("Failed to initialize conversation channel.");
  }

  private async ensureConversationExists(conversationId: string): Promise<void> {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .single();

    if (existing) return;

    // Parse conversation ID: e.g. "vchat_${listingId}_${buyerId}" or "lchat_${listingId}_${buyerId}"
    const parts = conversationId.split("_");
    if (parts.length < 3) return; // not a standard format
    const prefix = parts[0]; // "vchat" or "lchat"
    const listingId = parts[1];
    const buyerId = parts[2];
    const listingType = prefix === "vchat" ? "venture" : "item";

    // Query listing/venture details
    let listingTitle = "";
    let listingImage = "";
    let listingAskingPrice = 0;
    let sellerId = "";
    let sellerName = "";
    let sellerBatch = "";

    if (listingType === "venture") {
      const { data: venture } = await supabase
        .from("ventures")
        .select("*")
        .eq("id", listingId)
        .single();

      if (venture) {
        listingTitle = venture.name;
        listingImage = venture.logo_url || "";
        sellerId = venture.owner_id;
        sellerName = venture.owner_name;
        sellerBatch = "Venture Founder";
      }
    } else {
      const { data: listing } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

      if (listing) {
        listingTitle = listing.title;
        listingImage = listing.image_url || "";
        listingAskingPrice = Number(listing.price);
        sellerId = listing.seller_id;
        sellerName = listing.seller_name;
        sellerBatch = "Seller";
      }
    }

    // Query buyer details
    const user = await this.getSessionUser();
    const buyerName = user.user_metadata?.full_name || user.user_metadata?.name || "Student";
    const buyerBatch = user.user_metadata?.batch || "PGP 2025-27";

    // Insert conversation row!
    const nowStr = new Date().toISOString();
    const { error: insErr } = await supabase
      .from("conversations")
      .insert({
        id: conversationId,
        created_at: nowStr,
        buyer_id: buyerId,
        buyer_name: buyerName,
        buyer_batch: buyerBatch,
        seller_id: sellerId,
        seller_name: sellerName,
        seller_batch: sellerBatch,
        listing_id: listingId,
        listing_type: listingType,
        listing_title: listingTitle,
        listing_image: listingImage,
        listing_asking_price: listingAskingPrice,
        status: "negotiating",
        last_message_preview: "No messages yet",
        last_message_at: nowStr
      });

    if (insErr) {
      console.error("Error inserting conversation on-demand:", insErr);
      throw insErr;
    }
  }

  async markAsRead(conversationId: string): Promise<void> {
    try {
      const user = await this.getSessionUser();
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    } catch (e) {
      console.warn("Could not mark messages as read (is_read column may be missing):", e);
    }
  }
}

export const chatService: IChatService = new SupabaseChatService();
