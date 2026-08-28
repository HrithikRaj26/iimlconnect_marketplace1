# Technical Systems Overview: IIML Connect

## Technology Stack
The platform is built on a modern, high-performance web stack to ensure rapid development, type safety, and optimal user experience.

- **Framework:** Next.js 14 utilizing the modern App Router architecture.
- **Language:** TypeScript for end-to-end type safety and robust domain modeling.
- **Styling:** Tailwind CSS for utility-first styling and a custom design system.
- **Animations:** Framer Motion and native CSS keyframes for complex micro-interactions.

## Architectural Patterns

### Service Layer Abstraction
The application isolates UI components from direct network or database calls. All network access is decoupled behind strict service interfaces (e.g., `IListingService`, `ISearchService`, `IChatService`). 
- **Current State:** Implemented with Mock Service bodies allowing full UI functionality without a live backend.
- **Transition to Production:** Enables swapping mock data providers with real HTTP REST or WebSocket clients by simply updating the service implementation—requiring zero changes to component logic.

### AI & NLP Integration
- **Conversational Routing:** Features a command center that uses regex matching and Gemini LLM routing to parse natural language (e.g., "I lost my keys") and direct the user to the appropriately filtered module.
- **Voice Search:** Integrates with the native Web Speech API to provide hands-free voice search capabilities, specifically utilized in the global search and Lost & Found modules.

### State Management & Interactions
- **Context API & Reducers:** Used for complex, multi-step flows such as the 4-step listing creation wizard (`useListingDraft`).
- **Optimistic UI:** Used extensively in the messaging and offer negotiation systems to provide immediate visual feedback (e.g., message sending status) before server confirmation, with fallback retry mechanisms.
- **Real-Time Readiness:** The chat interface features structured state machines for transaction offers (Sent-Awaiting, Declined, Accepted, Deal Closed) designed to snap easily onto a real-time WebSocket backend.

## Deployment & Hosting
- **Target Platform:** Designed as a zero-config Next.js application tailored for Vercel deployment, utilizing edge caching and serverless functions implicitly via the App Router.
