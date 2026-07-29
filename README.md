# IIML Connect — Student Marketplace

A closed-campus marketplace web app for the IIM Lucknow community, where verified
students buy and sell pre-owned items. Built with **Next.js 14 (App Router)**,
**TypeScript**, and **Tailwind CSS**.

This repository implements **all three MVP features**: Feature 2 (Search &
Filters, the landing page), Feature 1 (Easy Item Listing with Photos), and
Feature 3 (Make an Offer & In-App Chat).

**The landing page is `/marketplace`** — the root URL `/` redirects there.

---

## Features implemented

**Feature 2 — Search & Filters** (landing page, `/marketplace`)
- Instant search-as-you-type (debounced) over listing titles
- Left filter sidebar: category, condition (with colour dots), price range, pickup location — each with live facet counts
- Sort options: Most Relevant, Newest First, Price Low→High, Price High→Low
- Apply / Reset filters, mobile filter toggle
- Loading (skeleton cards), empty / no-results, and error+retry states
- "Load more" pagination placeholder (swap for infinite scroll when ready)

**Feature 1 — Easy Item Listing with Photos** (`/listing/create`)
- 4-step guided flow: Upload Photos → Item Details → Pricing & Logistics → Preview & Publish
- Multi-image upload with drag-and-drop, drag-to-reorder, delete, automatic cover-photo selection
- Per-image upload lifecycle (uploading / uploaded / error) with retry-on-failure
- Full form validation, live preview, loading / error / empty / success states

**Feature 3 — Make an Offer & In-App Chat** (`/messages`, `/marketplace/[id]`)
- Product detail page with gallery, specs, seller card, and Make an Offer / Chat / Save actions
- Make an Offer modal: amount input, suggested-offer chips, optional message, respectful-offer notice, validation
- Full chat screen: conversation list sidebar, pinned product header, verified badge, online status
- Message bubbles with status ticks (sending / delivered / read) and read-receipt placeholder
- Optimistic message sending with failed→retry handling
- Offer cards rendered by state: sent-awaiting, declined, and incoming with Accept / Decline / Counter
- Counter-offer reuses the offer modal; offer state machine drives the transaction status
- Offer Accepted banner + Transaction Agreement card (final price, item, seller, pickup location & time)
- Deal Closed state locks the chat input
- Image attachment placeholder in the composer

All network access sits behind mock service interfaces (`IListingService`,
`ISearchService`, `IChatService`) — swap the mock bodies for real HTTP/WebSocket
calls and no component code changes.

---

## Getting started (local development)

**Prerequisites:** Node.js 18.17+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **"+ Sell an Item"** to
enter the listing flow.

**Production build check:**
```bash
npm run build
npm run start
```

---

## Deploying to Vercel

This is a zero-config Next.js app — Vercel detects and builds it automatically.

### Option A — via the Vercel dashboard (recommended)
1. Push this project to a GitHub repository (see below).
2. Go to [vercel.com/new](https://vercel.com/new) and **Import** the repository.
3. Leave all build settings at their defaults:
   - Framework Preset: **Next.js**
   - Build Command: `next build` (auto-detected)
   - Output: (auto-detected)
4. Click **Deploy**. Your production URL will be ready in ~1 minute.

### Option B — via the Vercel CLI
```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

---

## Pushing to GitHub (web UI, no terminal needed)

1. Create a new empty repository on [github.com/new](https://github.com/new)
   (do **not** initialise it with a README, since this project already has one).
2. On the new repo page, click **"uploading an existing file"**.
3. Drag the **contents** of this unzipped folder into the upload area.
   - Do **not** upload the `node_modules/` or `.next/` folders — they are excluded
     by `.gitignore` and Vercel rebuilds them automatically.
4. Commit the files. Then follow **Option A** above to connect the repo to Vercel.

> Tip: if you accidentally uploaded `node_modules`, delete that folder from the
> GitHub repo — it is large and unnecessary. The `.gitignore` in this project
> already lists it so a normal `git push` would skip it.

---

## Project structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Marketplace landing (entry to listing flow)
│   └── listing/create/       # Feature 1 — 4-step flow + success
│       ├── layout.tsx        # Wraps flow in ListingDraftProvider
│       ├── page.tsx          # Step 1 — Upload Photos
│       ├── details/          # Step 2 — Item Details
│       ├── pricing/          # Step 3 — Pricing & Logistics
│       ├── preview/          # Step 4 — Preview & Publish
│       └── success/          # Success confirmation
├── components/
│   ├── ui/                   # Generic reusables (Button, TextInput, etc.)
│   └── listing/              # Feature-specific components
├── hooks/                    # useListingDraft (Context+reducer), useImageUpload
├── services/                 # listingService (mock IListingService)
├── types/                    # Shared TypeScript domain types
├── utils/                    # validation, formatting
└── constants/                # categories, conditions, pickup options
```

---

## Swapping the mock backend for a real API

All network access is isolated in `src/services/listingService.ts` behind the
`IListingService` interface. To connect a real backend, replace the method bodies
of `MockListingService` with `fetch` calls (e.g. `POST /api/listings/images` and
`POST /api/listings`). No screen or component code needs to change.
