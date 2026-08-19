-- ============================================================================
-- Migration 005 — Marketplace chat fixes
-- ============================================================================
-- Enables:
--   1. listings.status column so accepted offers remove the item from the feed.
--   2. messages.is_read column so unread counts + notification dot work.
--   3. Supabase Realtime on `conversations` and `messages` so both parties see
--      offer accept / decline / counter events without reloading.
--
-- Run once against the Supabase Postgres (SQL Editor or psql). Idempotent.
-- ============================================================================

-- 1. Listings: add status column (default 'available'), used by:
--    - src/services/chatService.ts (respondToOffer marks 'sold' on accept)
--    - src/services/searchService.ts (filters out sold rows)
--    - src/app/marketplace/[id]/page.tsx (renders SOLD banner)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS status text
  NOT NULL DEFAULT 'available'
  CHECK (status IN ('available', 'sold', 'reserved', 'removed'));

CREATE INDEX IF NOT EXISTS listings_status_idx
  ON public.listings (status);

-- 2. Messages: add is_read column, used by unread badges + TopNav red dot.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_read boolean
  NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS messages_unread_idx
  ON public.messages (conversation_id, sender_id, is_read);

-- 3. Enable Supabase Realtime on chat tables. Without this, the OTHER user in
--    a conversation never sees the accept / decline / counter change until
--    they reload the page. (The app also polls every 3s as a fallback.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'listings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
  END IF;
END $$;

-- 4. RLS policy so the buyer/seller can update conversations + messages
--    (needed for accept/decline/countered status changes to succeed).
--    Adjust as needed — this assumes the tables already have RLS enabled.
DO $$ BEGIN
  CREATE POLICY "Chat participants can update their conversations."
    ON public.conversations FOR UPDATE
    USING ( auth.uid() = buyer_id OR auth.uid() = seller_id );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Chat participants can update messages in their conversations."
    ON public.messages FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. RLS policy so the buyer can mark a listing as sold via chatService.
DO $$ BEGIN
  CREATE POLICY "Buyers can mark a listing as sold via accepted offer."
    ON public.listings FOR UPDATE
    USING (
      auth.uid() = seller_id
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.listing_id = listings.id
          AND c.buyer_id = auth.uid()
          AND c.status = 'agreed'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
