---
title: UI Brand Guidelines
description: Strict design and branding rules for the IIML Connect platform.
---

# UI Brand Guidelines

## 1. Typography
- **Global Font**: `Inter`.
- **Rule**: Do not inject or use module-specific fonts (like Jost, Futura, or Century Gothic). Rely purely on Tailwind's default sans font which is configured to Inter.

## 2. Color Palette
- **Rule**: Avoid generic tailwind colors like `blue-500` or `gray-500` for primary UI elements.
- **Brand Identity**: Use the semantic `brand` and `success` colors defined in `tailwind.config.ts`.
  - Primary Buttons: `bg-brand hover:bg-brand-dark`
  - Success/Valid states: `text-success`
  - App Backgrounds: `bg-surface` or `bg-gray-50`

## 3. Aesthetics & Animations
- **Glassmorphism**: Use translucent backgrounds with backdrop blur for premium layered interfaces (e.g., `bg-white/80 backdrop-blur-md`).
- **3D Card Wobble**: Use the `.card-wobble` utility class on interactive cards (like Ventures and Lost & Found items) to give them a subtle 3D hover effect.
- **Mobile First**: Always ensure layouts break down elegantly on mobile screens (use `flex-col` on small screens, `flex-row` on `md:` screens). Ensure touch targets are at least `44px` tall on mobile.
