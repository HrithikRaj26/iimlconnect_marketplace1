import { ChatMessage, Offer } from "@/types";

/**
 * Service interface for Feature 3. Replace the mock body with real transport
 * (WebSocket / Supabase Realtime for chat, REST for offers) when the backend
 * exists. Components depend only on this interface.
 */
export interface IChatService {
  sendMessage(conversationId: string, text: string): Promise<{ deliveredAt: number }>;
  sendOffer(conversationId: string, amount: number, note?: string): Promise<{ offer: Offer }>;
  respondToOffer(
    conversationId: string,
    offerId: string,
    action: "accept" | "decline"
  ): Promise<{ ok: true }>;
}

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

class MockChatService implements IChatService {
  async sendMessage(): Promise<{ deliveredAt: number }> {
    // Small chance of failure so the "failed → retry" path is exercised.
    await delay(null, 600);
    if (Math.random() < 0.06) {
      throw new Error("Message failed to send.");
    }
    return { deliveredAt: Date.now() };
  }

  async sendOffer(
    _conversationId: string,
    amount: number,
    note?: string
  ): Promise<{ offer: Offer }> {
    await delay(null, 700);
    return {
      offer: {
        id: Math.random().toString(36).slice(2),
        amount,
        status: "pending",
        direction: "sent",
        createdAt: Date.now(),
        note,
      },
    };
  }

  async respondToOffer(): Promise<{ ok: true }> {
    await delay(null, 500);
    return { ok: true };
  }
}

export const chatService: IChatService = new MockChatService();
