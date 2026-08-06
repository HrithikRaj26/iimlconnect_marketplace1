"use client";

import React, { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopNav } from "@/components/ui/TopNav";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageThread } from "@/components/chat/MessageThread";
import { ChatInput } from "@/components/chat/ChatInput";
import { MakeOfferModal } from "@/components/chat/MakeOfferModal";
import { useConversation } from "@/hooks/useConversation";
import { chatService } from "@/services/chatService";
import { supabase } from "@/lib/supabase";
import { Conversation } from "@/types";

export default function MessagesPage() {
  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
      <TopNav active="messages" />
      <Suspense fallback={
        <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
          Loading conversations...
        </div>
      }>
        <ChatWorkspaceWrapper />
      </Suspense>
    </div>
  );
}

function ChatWorkspaceWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const ownerId = searchParams.get("ownerId");
  const ownerName = searchParams.get("ownerName");
  const ventureName = searchParams.get("ventureName");
  const logoUrl = searchParams.get("logoUrl");
  const askingPrice = searchParams.get("askingPrice");
  const listingId = searchParams.get("listingId");
  const listingType = searchParams.get("listingType") || "venture";
  const initialOfferAmount = searchParams.get("initialOfferAmount");
  const initialOfferNote = searchParams.get("initialOfferNote");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ name: string; batch: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const metadata = session.user.user_metadata || {};
        const fullName = metadata.full_name || metadata.name || "Student";
        const batch = metadata.batch || "PGP 2025-27";
        setCurrentUserProfile({ name: fullName, batch });
      } else {
        setLoading(false);
      }
    });
  }, []);

  // Fetch conversations list
  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].id);
      }
      if (activeId) {
        await chatService.markAsRead(activeId);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (activeId) {
      chatService.markAsRead(activeId);
    }
  }, [activeId]);

  // Load single active conversation thread (e.g. on realtime update)
  const loadActiveConversation = async (id: string) => {
    try {
      const list = await chatService.getConversations();
      setConversations(list);
      if (id === activeId) {
        await chatService.markAsRead(id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Setup Realtime subscriptions
  useEffect(() => {
    if (!currentUserId || !activeId) return;

    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          loadConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          loadActiveConversation(activeId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activeId]);

  // Process redirects and initialize chat room
  useEffect(() => {
    if (!currentUserId || !currentUserProfile || loading) return;

    const initRedirectChat = async () => {
      if (ownerId && ownerName && ventureName) {
        // Build a unique, deterministic chat ID based on buyer and seller / listing IDs
        const actualListingId = listingId || ownerId;
        const actualListingType = listingType as "item" | "venture";
        const chatId = actualListingType === "venture" 
          ? `vchat_${actualListingId}_${currentUserId}`
          : `lchat_${actualListingId}_${currentUserId}`;

        // Prevent founder/seller self-chatting
        if (ownerId === currentUserId) {
          alert("You cannot initiate a chat with yourself.");
          router.replace("/messages");
          return;
        }

        try {
          // 1. Create or retrieve conversation in database
          await chatService.createOrGetConversation({
            id: chatId,
            buyerId: currentUserId,
            buyerName: currentUserProfile.name,
            buyerBatch: currentUserProfile.batch,
            sellerId: ownerId,
            sellerName: ownerName,
            sellerBatch: actualListingType === "venture" ? "Venture Founder" : "Seller",
            listingId: actualListingId,
            listingType: actualListingType,
            listingTitle: ventureName,
            listingImage: logoUrl || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=150&h=150&fit=crop",
            listingAskingPrice: askingPrice ? Number(askingPrice) : 0
          });

          // 2. If an initial offer amount is present, submit it as the first message
          if (initialOfferAmount) {
            const offerVal = Number(initialOfferAmount);
            const noteVal = initialOfferNote || "";
            await chatService.sendOffer(chatId, offerVal, noteVal);
          }

          // 3. Set the newly created conversation active and refresh
          setActiveId(chatId);
          await loadConversations();

          // 4. Remove parameters from URL so refreshes don't re-trigger initialization
          router.replace("/messages");
        } catch (err) {
          console.error("Failed to initialize redirected conversation:", err);
        }
      }
    };

    initRedirectChat();
  }, [currentUserId, currentUserProfile, ownerId, ownerName, ventureName, logoUrl, askingPrice, listingId, listingType, initialOfferAmount, initialOfferNote, loading]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeId) || conversations[0] || null;
  }, [activeId, conversations]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <span className="text-sm font-semibold">Loading your conversations...</span>
        </div>
      </div>
    );
  }

  if (conversations.length === 0 && !activeId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8 text-center">
        <span className="text-5xl">💬</span>
        <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-gray-100">No Conversations Yet</h3>
        <p className="mt-2 text-xs font-semibold text-gray-400 max-w-xs leading-relaxed">
          Start a conversation by clicking "Contact Founder" on any venture page or "Chat with Seller" on listing details!
        </p>
      </div>
    );
  }

  if (!activeConversation) return null;

  return (
    <ChatWorkspace
      key={activeId}
      initialConversation={activeConversation}
      conversations={conversations}
      activeId={activeId || activeConversation.id}
      onSelect={setActiveId}
      offerModalOpen={offerModalOpen}
      setOfferModalOpen={setOfferModalOpen}
    />
  );
}

interface ChatWorkspaceProps {
  initialConversation: any;
  conversations: any[];
  activeId: string;
  onSelect: (id: string) => void;
  offerModalOpen: boolean;
  setOfferModalOpen: (open: boolean) => void;
}

function ChatWorkspace({
  initialConversation,
  conversations,
  activeId,
  onSelect,
  offerModalOpen,
  setOfferModalOpen,
}: ChatWorkspaceProps) {
  const {
    conversation,
    sendText,
    retryMessage,
    sendOffer,
    respondToOffer,
    transaction,
  } = useConversation(initialConversation);

  const dealClosed = transaction.status === "agreed" || transaction.status === "completed";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Conversation list */}
      <div className="hidden w-80 shrink-0 border-r border-gray-100 dark:border-gray-800 md:block bg-white dark:bg-gray-950">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
        />
      </div>

      {/* Active conversation */}
      <div className="flex min-w-0 flex-1 flex-col bg-gray-50 dark:bg-gray-900">
        <ChatHeader
          participant={conversation.participant}
          listing={conversation.listing}
          transaction={transaction}
          onMakeOffer={() => setOfferModalOpen(true)}
        />

        <MessageThread
          conversation={conversation}
          onRetryMessage={retryMessage}
          onAcceptOffer={(id) => respondToOffer(id, "accept")}
          onDeclineOffer={(id) => respondToOffer(id, "decline")}
          onCounterOffer={() => setOfferModalOpen(true)}
        />

        <ChatInput onSend={sendText} disabled={dealClosed} />
      </div>

      <MakeOfferModal
        open={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        listing={{
          title: conversation.listing.title,
          askingPrice: conversation.listing.askingPrice,
          imageUrl: conversation.listing.imageUrl,
          sellerName: conversation.participant.name,
          sellerRating: 4.9,
        }}
        onSubmit={async (amount, message) => {
          await sendOffer(amount, message);
        }}
      />
    </div>
  );
}
