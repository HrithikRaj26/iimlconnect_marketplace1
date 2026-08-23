# IIM Lucknow Connect — Website Synopsis

A summary of all user-facing sections, features, and technical implementations across the **IIM Lucknow (IIML) Connect** portal.

---

## 1. 🏠 Home / Dashboard
* **Route:** `/`
* **Core Page Component:** [`src/app/page.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/page.tsx)
* **Underlying Component:** [`WelcomeDashboard`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/components/dashboard/WelcomeDashboard.tsx)
* **Overview:** 
  The central homepage entry point for authenticated users. It serves as a dashboard featuring:
  * **Personalized Greetings:** Dynamic time-of-day greetings tailored to the student's first name.
  * **Conversational AI Command Center:** A [`GlobalSearchBar`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/components/dashboard/GlobalSearchBar.tsx) featuring conversational query matching (via regex and Gemini LLM routing), voice search integration, and an interactive AI chat assistant popover.
  * **Quick Navigation Cards:** Grid shortcuts to buy/sell items, report lost property, or browse registered startups.
  * **Daily Streak Widget:** A custom [`StreakWidget`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/components/dashboard/StreakWidget.tsx) tracking login consistency to drive student engagement.

---

## 2. 🔍 Unified Search Results
* **Route:** `/search?q=<query>`
* **Core Page Component:** [`src/app/search/page.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/search/page.tsx)
* **Overview:**
  A unified search results portal. It queries the backend global search service to show matches across all three main domains in separate modules:
  * **Marketplace** (Pre-owned listings)
  * **Student Ventures** (Campus startups)
  * **Lost & Found** (Lost/found reports)

---

## 3. 🛒 Student Marketplace (Buy & Sell)
* **Route:** `/marketplace`
* **Core Page Component:** [`src/app/marketplace/page.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/marketplace/page.tsx)
* **Overview:**
  A closed-campus marketplace for listing and buying pre-owned products. It includes:
  * **Instant Search & live filters:** Debounced title search, coupled with sidebar filters for Category, Condition (represented by color-coded indicator dots), Price Range, and Pickup Location.
  * **Sorting options:** Sort by Relevance, Newest First, Price Low to High, and Price High to Low.
  * **Mobile Flexibility:** Responsive slide-out filters and a floating action button (FAB) on mobile layout prompting users to list items quickly.

---

## 4. ➕ Item Listing Creation Flow
* **Route:** `/listing/create`
* **Core Page Component:** [`src/app/listing/create/page.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/listing/create/page.tsx)
* **Overview:**
  An easy 4-step wizard guide facilitating listing creation:
  1. **Upload Photos:** Multi-image drag-and-drop uploader with drag-to-reorder support and cover photo indicators.
  2. **Item Details:** Title, description, category, and condition specification.
  3. **Pricing & Logistics:** Pricing details and campus pickup coordinates.
  4. **Preview & Publish:** Full live preview showing how the product will look to potential buyers before confirming publication.

---

## 5. 📦 Product Details
* **Route:** `/marketplace/[id]`
* **Core Page Component:** [`src/app/marketplace/[id]/page.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/marketplace/[id]/page.tsx)
* **Overview:**
  The detailed display for a specific marketplace item. Features include:
  * **Gallery Lightbox:** Carousel displaying all uploaded product photos.
  * **Specs Sheet:** Item condition, pricing, listing age, and description details.
  * **Seller Card:** Information identifying the student listing the item.
  * **Calls-to-Action:** Primary buttons to "Make an Offer", save the item, or initiate a chat dialogue.

---

## 6. 💬 Make an Offer & In-App Chat
* **Route:** `/messages`
* **Core Page Component:** [`src/app/messages/page.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/messages/page.tsx)
* **Overview:**
  A real-time negotiations workspace. It combines:
  * **Conversational Interface:** Sidebar conversation list, online status indicators, and verified badges.
  * **Make an Offer Modal:** Numerical input, rapid-select offer chips, and bargaining etiquette guidance.
  * **Offer Status Engine:** Chat bubble updates tracking the bargaining lifecycle (Awaiting Decision, Declined, Countered, Accepted).
  * **Transaction Agreement:** An automated card locking in final terms (final price, pickup instructions) once an offer is accepted, disabling chat input to formalize the deal.

---

## 7. 🔍 Campus Lost & Found
* **Route:** `/lost-found`
* **Core Page Component:** [`src/app/lost-found/page.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/lost-found/page.tsx)
* **Overview:**
  A secure repository tracking campus items. Includes three main views:
  * **Lost Tab:** Current items missing on campus.
  * **Found Tab:** Retrieved items awaiting identification.
  * **My Reports Tab:** Custom board of items reported by the user, augmented by an **Instant Match algorithm** that highlights matches from other students.
  * **Voice Search Integration:** Hands-free voice recognition allowing students to search items verbally.
  * **Reporting Wizard:** Simple form triggers to report lost items or report found items quickly.

---

## 8. 🚀 Student Venture Hub & Community
* **Route:** `/ventures`
* **Core Page Component:** [`src/app/ventures/page.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/ventures/page.tsx)
* **Overview:**
  A portal dedicated to highlighting student startups, groups, and commercial projects on campus:
  * **Discover Ventures:** Categories of active student startups (food delivery, services, laundry services) with reviews, catalog items, and founder coordinates.
  * **Community Feed:** Discussion boards allowing students to ask questions, post announcements, or write reviews.
  * **Reputation Shelf:** Leaderboard highlighting the most credible startups/contributors.
  * **My Ventures:** Registration form allowing creators to list new ventures.
  * **Admin Panel:** Moderation panel enabling administrators to audit startup registrations and feed content.

---

## 9. 👤 My Profile
* **Route:** `/profile`
* **Core Page Component:** [`src/app/profile/page.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/profile/page.tsx)
* **Overview:**
  Student profile settings panel to edit profile fields (full name, custom profile avatar, guest/student flags). Warns users dynamically via a site-wide top banner if mandatory registration parameters are incomplete.

---

## 10. 🛡️ Admin Intent Route Manager
* **Route:** `/admin/intents`
* **Core Page Component:** [`src/app/admin/intents/page.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/admin/intents/page.tsx)
* **Overview:**
  An administration interface to manage conversational triggers. Admins can update the matching dictionary mapping user conversational inputs (e.g., *"i lost my keys"*) to specific application actions (like opening the Lost & Found portal pre-filtered for keys).

---

## 🎨 UI/UX Design System Summary

The website implements a premium, engaging, and highly modern design system tailored to campus students:

1. **Contextual Color-Coding (Theme-by-Section):**
   To aid navigation and mental mapping, each primary portal is associated with a distinct color brand accent:
   * **Marketplace:** Blue / Indigo
   * **Lost & Found:** Purple / Fuchsia
   * **Student Ventures:** Orange / Amber
   * **Messages / Chat:** Teal / Cyan
   * **Profile:** Violet / Slate
   * **Admin Console:** Red / Rose
   *This color scheme dynamically changes global UI elements like the "Scroll to Top" button, focus rings, hover indicators, and dashboard gradients.*

2. **Distinctive Editorial Typography:**
   Pairing the premium academic/institutional serif display typeface **Playfair Display** (for headers and page titles) with the clean, highly readable functional UI sans-serif **Inter** (for body copy, data grids, inputs, and controls).

3. **Premium Micro-Animations:**
   Enhances user engagement through subtle visual feedbacks:
   * **Card Wobbles:** 3D perspective tilt animations (`card-wobble`) when hovering over listing cards.
   * **Framer Motion Transitions:** Smooth loading overlays, slide-out sidebars, and tab changes.
   * **Shaking Alerts:** Shake animation (`animate-shake`) triggered on validation errors.
   * **Typewriter Greeting:** A typewriter effect animating the greeting text.
   * **Moving Borders:** Glowing animated borders (via Aceternity UI components) highlight call-to-action buttons.

4. **Responsive Dual-Shell Layout:**
   The site features an [`AppLayout`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/components/layout/AppLayout.tsx) which collapses to a drawer menu on smaller screens, supplemented by a dedicated mobile bottom navigation bar (`safe-area-pb`), ensuring a fluid experience across desktop and mobile.

5. **First-Class Dark Mode:**
   Full class-based dark mode (`.dark`) covering all inputs, borders, backgrounds, card overlays, and typography with smooth `0.25s` fade transitions between modes.

6. **Interactive Auditory & Speech Cues:**
   * Plays a welcome chime (`playWelcomeSound`) upon logging in.
   * Hands-free voice recognition for searches (`useVoiceSearch`) utilizing the Web Speech API.

---

## 🎨 Deep-Dive UI/UX Design System Specification

### A. Contextual Section Branding Color Matrix
Instead of applying a single monochromatic brand color, the portal relies on **functional division mapping**. Sections are assigned distinct color accents to minimize cognitive load during navigation:

| Platform Segment | Dominant Color | Secondary Accent | UX Application |
| :--- | :--- | :--- | :--- |
| **Global Core / Brand** | `#2563EB` (Blue) | `#1D4ED8` (Dark Blue) | Primary outlines, focus state borders, default button states. |
| **Marketplace** | Blue / Indigo | `#EFF4FF` (Soft Light Blue) | Form input focus, pricing filters, search highlight text. |
| **Lost & Found** | Purple / Fuchsia | Soft Purple | Highlight alert tags, match confirmations, recovery banners. |
| **Student Ventures** | Orange / Amber | Peach / Light Orange | Founder tags, review points, registered startup cards. |
| **Chat & Messages** | Teal / Cyan | Soft Teal | Message status ticks, verified indicators, online user rings. |
| **Admin Operations** | Red / Rose | Soft Rose | Intent trigger deletion buttons, critical warning cards. |

*This theme system overrides standard elements dynamically, including scroll indicators, floating action buttons (FABs), and header borders (configured in [`AppLayout.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/components/layout/AppLayout.tsx#L56-L87)).*

### B. Typography & Hierarchical Weighting
Typography is the primary identity mechanism of the platform, utilizing a dual-typeface system to achieve an institutional yet functional aesthetic:
* **Editorial Headers:** All core page headers (`h1`, `h2`, `h3`, etc.) use the serif **Playfair Display** (configured in [`tailwind.config.ts`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/tailwind.config.ts#L22-L26)). Headings are styled with normal or wide tracking (`tracking-normal` or `tracking-wide`) and elegant semi-bold weights (`font-semibold`), separating the app's visual identity from typical startup templates.
* **Functional UI:** Labels, buttons, input text, message bubbles, and details specs use the clean sans-serif **Inter** (under `@apply font-sans`) to ensure high readability and accessibility.
* **Secondary Tags:** Metadata markers are set to uppercase with wide character tracking (`tracking-widest`) and a tiny size (`text-[10px]`) for a clean layout hierarchy.

### C. Spacing, Elevation & Fluid Masonry Layouts
* **Elevation & Shadow Cards:** Elevation uses a custom shadow key `shadow-card` defined in the tailwind config:
  `0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)`
  This prevents thick blocky boundaries, giving a modern paper layer effect.
* **Border Radii:** Corners are curved using standard `rounded-xl` (12px) and custom `rounded-2xl` (16px) properties, offering a soft look.
* **Fluid Masonry (Lost & Found):** Unlike unified CSS grid layouts that create large empty gaps below cards of differing heights, the **Lost & Found** page uses a CSS multi-column setup:
  `columns-1 sm:columns-2 xl:columns-3 gap-5` with `break-inside-avoid`.
  This nests matched alert cards right under standard cards vertically, eliminating layout gaps.

### D. Interactive Animations & Motion Mechanics
Animations are divided into CSS keyframes and spring-based components:
* **Hover Perspective Wobble (`card-wobble`):** Applied to marketplace and venture cards, invoking 3D rotation on mouse movement:
  ```css
  @keyframes card-wobble {
    0% { transform: perspective(700px) rotate3d(0, 0, 0, 0deg) scale3d(1, 1, 1); }
    30% { transform: perspective(700px) rotate3d(1, 1, 0, 2.5deg) scale3d(1.015, 1.015, 1.015); }
    60% { transform: perspective(700px) rotate3d(-1, 1, 0, -1.5deg) scale3d(1.015, 1.015, 1.015); }
    100% { transform: perspective(700px) rotate3d(0, 0, 0, 0deg) scale3d(1, 1, 1); }
  }
  ```
* **Shaking Alerts (`animate-shake`):** Triggered on incorrect input submissions, rendering a prompt horizontal layout vibration.
* **Spring Dynamics:** Framer Motion settings use spring physics (`stiffness: 420`, `damping: 26`) for UI drawers, mobile backdrop toggles, and floating menus.
* **Moving Borders (`moving-border.tsx`):** A custom SVG component [`moving-border.tsx`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/components/ui/moving-border.tsx) renders animated gradient highlights traveling along component paths.

### E. Global Theme Switch & CSS-in-JS Mapping
Rather than repeating Tailwind dark variants across all TSX templates (which bloats code files), dark mode re-mappings are handled globally in [`src/app/globals.css`](file:///Users/shinjanpatra/Documents/IIML_Connect/iimlconnect_marketplace1/src/app/globals.css#L33-L84):
* **Class Toggle:** When `.dark` is set on the root layout, background surfaces (`.bg-white` to `#111827`, `.bg-gray-50` to `#030712`) and borders remap automatically.
* **Smooth Transitions:** Transitions for colors, backgrounds, and borders are mapped to `0.20s ease` globally to guarantee smooth theme toggling.


