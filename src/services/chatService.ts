import { ChatMessage, Offer, Conversation } from "@/types";
import { supabase } from "@/lib/supabase";

function formatLastMessageAt(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    
    // Reset hours to compare calendar days
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (msgDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } else if (msgDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else if (today.getTime() - msgDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  } catch {
    return "";
  }
}

// --------------------------------------------------------------------------
// Deletion Store: { id -> deletedAtMs }
// A conversation is suppressed only until the other party sends a new message
// (i.e. db last_message_at > our deletedAtMs). This mirrors WhatsApp behaviour.
// --------------------------------------------------------------------------
interface DeletedEntry { deletedAt: number }

function getDeletedMap(): Record<string, DeletedEntry> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("iiml-deleted-conversations-v2");
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveDeletedMap(map: Record<string, DeletedEntry>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("iiml-deleted-conversations-v2", JSON.stringify(map));
  } catch {}
}

function addToDeletedMap(conversationId: string) {
  const map = getDeletedMap();
  map[conversationId] = { deletedAt: Date.now() };
  saveDeletedMap(map);
}

function removeFromDeletedMap(conversationId: string) {
  const map = getDeletedMap();
  delete map[conversationId];
  saveDeletedMap(map);
}

/**
 * Returns true if this conversation row should be hidden.
 * A conversation is hidden only if it was deleted AND no new messages have
 * arrived since deletion (last_message_at <= deletedAt).
 */
function isConversationSuppressed(row: { id: string; last_message_at: string }): boolean {
  const map = getDeletedMap();
  const entry = map[row.id];
  if (!entry) return false; // not deleted at all

  const lastMsgMs = new Date(row.last_message_at).getTime();
  if (lastMsgMs > entry.deletedAt) {
    // New activity! Automatically un-suppress (like WhatsApp)
    removeFromDeletedMap(row.id);
    return false;
  }
  return true; // still suppressed
}

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
  createOrGetDmConversation(params: {
    targetUserId: string;
    targetUserName: string;
    targetUserBatch: string;
    currentUserId: string;
    currentUserName: string;
    currentUserBatch: string;
  }): Promise<Conversation>;
  markAsRead(conversationId: string): Promise<void>;
  editMessage(messageId: string, newText: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  deleteConversation(conversationId: string): Promise<void>;
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

    // Filter using the v2 deletion map (respects new-message resurrection)
    const activeRows = (data || []).filter(row => !isConversationSuppressed(row));

    const items: Conversation[] = [];

    // Get read and deleted message ids from localStorage fallbacks
    let readMessageIds: string[] = [];
    let deletedMsgIds: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const storedRead = localStorage.getItem("iiml-read-messages");
        readMessageIds = storedRead ? JSON.parse(storedRead) : [];
        const storedDel = localStorage.getItem("iiml-deleted-messages");
        deletedMsgIds = storedDel ? JSON.parse(storedDel) : [];
      } catch {}
    }

    for (const row of activeRows) {
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

      const activeMsgs = (msgRows || []).filter(m => !deletedMsgIds.includes(m.id));

      const unreadCount = activeMsgs.filter(m => {
        if (m.sender_id === currentUserId) return false;
        const isRead = m.is_read === true || readMessageIds.includes(m.id);
        return !isRead;
      }).length;

      const mappedMessages: ChatMessage[] = activeMsgs.map(m => {
        const isRead = m.is_read === true || readMessageIds.includes(m.id);
        return {
          id: m.id,
          kind: m.kind as "text" | "offer",
          authorId: m.sender_id === currentUserId ? "me" : m.sender_id,
          createdAt: new Date(m.created_at).getTime(),
          status: isRead ? "read" : "delivered",
          text: m.text_content || undefined,
          offer: m.kind === "offer" ? {
            id: m.id,
            amount: Number(m.offer_amount),
            status: m.offer_status as any,
            direction: m.sender_id === currentUserId ? "sent" : "received",
            createdAt: new Date(m.created_at).getTime(),
            note: m.offer_note || undefined
          } : undefined
        };
      });

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
        lastMessageAt: formatLastMessageAt(row.last_message_at),
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

    // Filter locally deleted messages and map read status
    let deletedMsgIds: string[] = [];
    let readMessageIds: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const storedDel = localStorage.getItem("iiml-deleted-messages");
        deletedMsgIds = storedDel ? JSON.parse(storedDel) : [];
        const storedRead = localStorage.getItem("iiml-read-messages");
        readMessageIds = storedRead ? JSON.parse(storedRead) : [];
      } catch {}
    }

    const activeMsgs = (data || []).filter(m => !deletedMsgIds.includes(m.id));

    return activeMsgs.map(m => {
      const isRead = m.is_read === true || readMessageIds.includes(m.id);
      return {
        id: m.id,
        kind: m.kind as "text" | "offer",
        authorId: m.sender_id === currentUserId ? "me" : m.sender_id,
        createdAt: new Date(m.created_at).getTime(),
        status: isRead ? "read" : "delivered",
        text: m.text_content || undefined,
        offer: m.kind === "offer" ? {
          id: m.id,
          amount: Number(m.offer_amount),
          status: m.offer_status as any,
          direction: m.sender_id === currentUserId ? "sent" : "received",
          createdAt: new Date(m.created_at).getTime(),
          note: m.offer_note || undefined
        } : undefined
      };
    });
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
      // If it was deleted but re-visited intentionally, un-suppress it
      removeFromDeletedMap(params.id);
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

  async createOrGetDmConversation(params: {
    targetUserId: string;
    targetUserName: string;
    targetUserBatch: string;
    currentUserId: string;
    currentUserName: string;
    currentUserBatch: string;
  }): Promise<Conversation> {
    // Canonical ID: sort the two user IDs so dm_A_B === dm_B_A
    const [u1, u2] = [params.currentUserId, params.targetUserId].sort();
    const dmId = `dm_${u1}_${u2}`;

    // Check if already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", dmId)
      .single();

    if (existing) {
      // Un-suppress if previously deleted
      removeFromDeletedMap(dmId);
      const list = await this.getConversations();
      const found = list.find((c) => c.id === dmId);
      if (found) return found;
    }

    // Create new DM conversation
    const nowStr = new Date().toISOString();
    const { error } = await supabase.from("conversations").insert({
      id: dmId,
      created_at: nowStr,
      buyer_id: params.currentUserId,
      buyer_name: params.currentUserName,
      buyer_batch: params.currentUserBatch,
      seller_id: params.targetUserId,
      seller_name: params.targetUserName,
      seller_batch: params.targetUserBatch,
      listing_id: dmId,
      listing_type: "item",
      listing_title: "Direct Message",
      listing_image: "",
      listing_asking_price: 0,
      status: "negotiating",
      last_message_preview: "Say hi! 👋",
      last_message_at: nowStr,
    });

    if (error) throw error;

    const list = await this.getConversations();
    const found = list.find((c) => c.id === dmId);
    if (found) return found;
    throw new Error("Failed to create DM conversation.");
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
      
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id")
        .eq("conversation_id", conversationId);
        
      if (msgs && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("iiml-read-messages");
          const list = stored ? JSON.parse(stored) : [];
          const unreadIds = msgs
            .filter((m: any) => m.sender_id !== user.id && !list.includes(m.id))
            .map((m: any) => m.id);
            
          if (unreadIds.length > 0) {
            localStorage.setItem("iiml-read-messages", JSON.stringify([...list, ...unreadIds]));
          }
        } catch {}
      }

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

  async editMessage(messageId: string, newText: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .update({ text_content: newText })
      .eq("id", messageId);
    if (error) throw error;
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("iiml-deleted-messages");
        const list = stored ? JSON.parse(stored) : [];
        if (!list.includes(messageId)) {
          localStorage.setItem("iiml-deleted-messages", JSON.stringify([...list, messageId]));
        }
      } catch {}
    }
    try {
      await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);
    } catch {}
  }

  async deleteConversation(conversationId: string): Promise<void> {
    // Store with timestamp so new messages can resurrect this conversation
    addToDeletedMap(conversationId);

    try {
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId);
      await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);
    } catch {}
  }
}

export const chatService: IChatService = new SupabaseChatService();
