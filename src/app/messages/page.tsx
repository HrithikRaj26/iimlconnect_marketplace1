"use client";

import React, { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TopNav } from "@/components/ui/TopNav";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageThread } from "@/components/chat/MessageThread";
import { ChatInput } from "@/components/chat/ChatInput";
import { MakeOfferModal } from "@/components/chat/MakeOfferModal";
import { useConversation } from "@/hooks/useConversation";
import { MOCK_CONVERSATIONS } from "@/constants/chat";

export default function MessagesPage() {
  return (
    <div className="flex h-screen flex-col bg-white">
      <TopNav active="messages" />
      <Suspense fallback={
        <div className="flex flex-1 items-center justify-center bg-gray-50 text-gray-500">
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
  const ownerId = searchParams.get("ownerId");
  const ownerName = searchParams.get("ownerName");
  const ventureName = searchParams.get("ventureName");
  const logoUrl = searchParams.get("logoUrl");

  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [activeId, setActiveId] = useState(MOCK_CONVERSATIONS[0].id);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  useEffect(() => {
    if (ownerId && ownerName && ventureName) {
      const chatId = `venture_chat_${ownerId}`;
      const exists = conversations.some((c) => c.id === chatId);
      
      if (!exists) {
        const newChat = {
          id: chatId,
          participant: {
            id: ownerId,
            name: ownerName,
            batch: "Venture Founder",
            online: true,
            verified: true,
            avatarColor: "#D97706", // Amber
          },
          listing: {
            id: `v_${ownerId}`,
            title: ventureName,
            askingPrice: 0, // 0 hides the "Make Offer" button
            imageUrl: logoUrl || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=150&h=150&fit=crop",
          },
          lastMessagePreview: "Click to chat with the founder",
          lastMessageAt: "Just now",
          unreadCount: 0,
          transaction: { status: "negotiating" as const },
          messages: [
            {
              id: "init_msg",
              kind: "text" as const,
              authorId: ownerId,
              createdAt: Date.now(),
              status: "read" as const,
              text: `Hi! Thanks for checking out ${ventureName}. Drop a message here and we will get back to you!`,
            }
          ]
        };
        setConversations([newChat, ...conversations]);
        setActiveId(chatId);
      } else {
        setActiveId(chatId);
      }
    }
  }, [ownerId, ownerName, ventureName, logoUrl]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || conversations[0] || MOCK_CONVERSATIONS[0],
    [activeId, conversations]
  );

  return (
    <ChatWorkspace
      key={activeId}
      initialConversation={activeConversation}
      conversations={conversations}
      activeId={activeId}
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
      <div className="hidden w-80 shrink-0 border-r border-gray-100 md:block">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
        />
      </div>

      {/* Active conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
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
