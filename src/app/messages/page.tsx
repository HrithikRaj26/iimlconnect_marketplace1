"use client";

import React, { useMemo, useState } from "react";
import { TopNav } from "@/components/ui/TopNav";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageThread } from "@/components/chat/MessageThread";
import { ChatInput } from "@/components/chat/ChatInput";
import { MakeOfferModal } from "@/components/chat/MakeOfferModal";
import { useConversation } from "@/hooks/useConversation";
import { MOCK_CONVERSATIONS } from "@/constants/chat";

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(MOCK_CONVERSATIONS[0].id);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  const initialConversation = useMemo(
    () => MOCK_CONVERSATIONS.find((c) => c.id === activeId)!,
    [activeId]
  );

  // Keyed by activeId so switching conversations resets the hook's local state.
  return (
    <div className="flex h-screen flex-col bg-white">
      <TopNav active="messages" />
      <ChatWorkspace
        key={activeId}
        initialConversation={initialConversation}
        activeId={activeId}
        onSelect={setActiveId}
        offerModalOpen={offerModalOpen}
        setOfferModalOpen={setOfferModalOpen}
      />
    </div>
  );
}

interface ChatWorkspaceProps {
  initialConversation: (typeof MOCK_CONVERSATIONS)[number];
  activeId: string;
  onSelect: (id: string) => void;
  offerModalOpen: boolean;
  setOfferModalOpen: (open: boolean) => void;
}

function ChatWorkspace({
  initialConversation,
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
          conversations={MOCK_CONVERSATIONS}
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
