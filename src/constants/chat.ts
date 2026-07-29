import { Conversation } from "@/types";

export const CURRENT_USER_ID = "me";

/** How long an offer stays actionable before it is treated as expired (mock). */
export const OFFER_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Suggested quick-offer amounts are derived from the asking price at runtime. */
export function suggestedOffers(asking: number): number[] {
  return [
    Math.round((asking * 0.875) / 100) * 100, // ~ -12.5%
    Math.round((asking * 0.94) / 100) * 100, //  ~ -6%
    asking,
  ];
}

const now = Date.now();

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    participant: {
      id: "rahul",
      name: "Rahul Verma",
      batch: "PGP 2025-27",
      online: true,
      verified: true,
      avatarColor: "#2563EB",
    },
    listing: {
      id: "l7",
      title: "Lenovo ThinkPad E14 Gen 2",
      askingPrice: 32000,
      imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80",
    },
    lastMessagePreview: "Deal at ₹30,000 ✓",
    lastMessageAt: "10:32 AM",
    unreadCount: 0,
    transaction: { status: "negotiating" },
    messages: [
      {
        id: "m1",
        kind: "text",
        authorId: "rahul",
        createdAt: now - 1000 * 60 * 8,
        status: "read",
        text: "Yes, absolutely! Just listed it yesterday. It's in perfect condition — barely used these past few months. Comes with the original charger and box.",
      },
      {
        id: "m2",
        kind: "text",
        authorId: "me",
        createdAt: now - 1000 * 60 * 7,
        status: "read",
        text: "Nice! Would you consider ₹28,000? I can pick up anytime this week.",
      },
    ],
  },
  {
    id: "c2",
    participant: {
      id: "priya",
      name: "Priya Kapoor",
      batch: "PGP 2025-27",
      online: false,
      verified: true,
      avatarColor: "#DB2777",
    },
    listing: {
      id: "l10",
      title: "Marketing Management by Kotler",
      askingPrice: 550,
      imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80",
    },
    lastMessagePreview: "Can you do ₹800?",
    lastMessageAt: "Yesterday",
    unreadCount: 2,
    transaction: { status: "negotiating" },
    messages: [
      {
        id: "m1",
        kind: "text",
        authorId: "priya",
        createdAt: now - 1000 * 60 * 60 * 26,
        status: "read",
        text: "Hi! Is the Kotler textbook still available?",
      },
      {
        id: "m2",
        kind: "text",
        authorId: "priya",
        createdAt: now - 1000 * 60 * 60 * 25,
        status: "delivered",
        text: "Can you do ₹800?",
      },
    ],
  },
  {
    id: "c3",
    participant: {
      id: "arnav",
      name: "Arnav Singh",
      batch: "PGP 2025-27",
      online: false,
      verified: true,
      avatarColor: "#059669",
    },
    listing: {
      id: "l3",
      title: "Hero Sprint Pro Bicycle",
      askingPrice: 3800,
      imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80",
    },
    lastMessagePreview: "Sure, pick up anytime!",
    lastMessageAt: "Mon",
    unreadCount: 0,
    transaction: { status: "negotiating" },
    messages: [
      {
        id: "m1",
        kind: "text",
        authorId: "me",
        createdAt: now - 1000 * 60 * 60 * 50,
        status: "read",
        text: "Great, works for me. When can I collect?",
      },
      {
        id: "m2",
        kind: "text",
        authorId: "arnav",
        createdAt: now - 1000 * 60 * 60 * 49,
        status: "read",
        text: "Sure, pick up anytime!",
      },
    ],
  },
];
