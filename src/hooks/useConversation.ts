"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ChatMessage,
  Conversation,
  Offer,
  OfferStatus,
  Transaction,
} from "@/types";
import { chatService } from "@/services/chatService";
import { CURRENT_USER_ID } from "@/constants/chat";
import { generateId } from "@/utils/format";

interface UseConversationResult {
  conversation: Conversation;
  sendText: (text: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  sendOffer: (amount: number, note?: string) => Promise<void>;
  respondToOffer: (
    messageId: string,
    action: "accept" | "decline"
  ) => Promise<void>;
  transaction: Transaction;
}

export function useConversation(initial: Conversation): UseConversationResult {
  const [conversation, setConversation] = useState<Conversation>(initial);

  useEffect(() => {
    setConversation(initial);
  }, [initial]);

  const patchMessage = useCallback(
    (messageId: string, patch: Partial<ChatMessage>) => {
      setConversation((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === messageId ? { ...m, ...patch } : m
        ),
      }));
    },
    []
  );

  const appendMessage = useCallback((message: ChatMessage) => {
    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  // ── Text messages with optimistic UI ──────────────────────────────────────
  const deliverText = useCallback(
    async (message: ChatMessage) => {
      try {
        const { deliveredAt } = await chatService.sendMessage(
          conversation.id,
          message.text ?? ""
        );
        patchMessage(message.id, { status: "delivered" });
        // Simulate the counterparty reading shortly after (read-receipt placeholder).
        void deliveredAt;
      } catch {
        patchMessage(message.id, { status: "failed" });
      }
    },
    [conversation.id, patchMessage]
  );

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const optimistic: ChatMessage = {
        id: generateId(),
        kind: "text",
        authorId: CURRENT_USER_ID,
        createdAt: Date.now(),
        status: "sending",
        text: trimmed,
      };
      appendMessage(optimistic);
      await deliverText(optimistic);
    },
    [appendMessage, deliverText]
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      const message = conversation.messages.find((m) => m.id === messageId);
      if (!message) return;
      patchMessage(messageId, { status: "sending" });
      await deliverText(message);
    },
    [conversation.messages, deliverText, patchMessage]
  );

  // ── Offers ────────────────────────────────────────────────────────────────
  const setOfferStatus = useCallback(
    (messageId: string, status: OfferStatus) => {
      setConversation((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === messageId && m.offer
            ? { ...m, offer: { ...m.offer, status } }
            : m
        ),
      }));
    },
    []
  );

  const sendOffer = useCallback(
    async (amount: number, note?: string) => {
      const optimisticOffer: Offer = {
        id: generateId(),
        amount,
        status: "pending",
        direction: "sent",
        createdAt: Date.now(),
        note,
      };
      const optimisticMessage: ChatMessage = {
        id: generateId(),
        kind: "offer",
        authorId: CURRENT_USER_ID,
        createdAt: Date.now(),
        status: "sending",
        offer: optimisticOffer,
      };
      appendMessage(optimisticMessage);
      try {
        await chatService.sendOffer(conversation.id, amount, note);
        patchMessage(optimisticMessage.id, { status: "delivered" });
      } catch {
        patchMessage(optimisticMessage.id, { status: "failed" });
      }
    },
    [appendMessage, conversation.id, patchMessage]
  );

  const respondToOffer = useCallback(
    async (messageId: string, action: "accept" | "decline") => {
      const message = conversation.messages.find((m) => m.id === messageId);
      if (!message?.offer) return;

      // Optimistically reflect the decision.
      const nextStatus: OfferStatus = action === "accept" ? "accepted" : "declined";
      setOfferStatus(messageId, nextStatus);

      if (action === "accept") {
        setConversation((prev) => ({
          ...prev,
          transaction: {
            status: "agreed",
            finalAmount: message.offer!.amount,
            pickupLocation: "Hostel Block B, Room 405-A",
            pickupTime: "Today, 6:00 PM – 8:00 PM",
          },
        }));
      }

      try {
        await chatService.respondToOffer(conversation.id, message.offer.id, action);
      } catch {
        // Roll back on failure.
        setOfferStatus(messageId, "pending");
      }
    },
    [conversation.id, conversation.messages, setOfferStatus]
  );

  const transaction = useMemo(() => conversation.transaction, [conversation.transaction]);

  return {
    conversation,
    sendText,
    retryMessage,
    sendOffer,
    respondToOffer,
    transaction,
  };
}
