# UI/UX Engineering Guidelines

## Purpose

Use these guidelines for every user-facing interface built or modified in this project.

The goal is to create interfaces that feel **intentional, polished, fast, accessible, and human-designed**.

Do not generate generic "AI slop" interfaces. Avoid blindly applying trendy visual patterns, excessive decoration, unnecessary gradients, oversized typography, excessive rounded cards, or animations without purpose.

Prioritize, in order:

1. Product usability
2. Clarity
3. Information hierarchy
4. Accessibility
5. Responsiveness
6. Performance
7. Visual polish

---

# 1. Before Writing UI Code

Before implementing a screen or component:

* Understand the user goal and primary action.
* Identify the information hierarchy.
* Determine the important states and edge cases.
* Reuse existing components and design tokens where possible.
* Do not introduce new visual patterns when an existing pattern solves the problem.
* Prefer simple, familiar interactions over novel interactions.
* Build the simplest interface that clearly solves the problem.

Do not add UI elements merely because they "look good."

Every visible element should serve one or more of these purposes:

* communicate information
* enable an action
* provide feedback
* establish hierarchy
* support navigation

If it serves none of these purposes, remove it.

---

# 2. Avoid AI-Generated Visual Clichés

Do not automatically use:

* excessive rounded cards
* a card for every piece of information
* gradients without a product or brand reason
* glowing elements
* excessive glassmorphism
* unnecessary shadows
* oversized headings
* huge hero sections that waste screen space
* floating decorative blobs
* random illustrations
* generic dashboard widgets
* excessive badges and pills
* excessive use of icons
* icons next to every heading
* excessive borders
* multiple competing accent colors
* excessive animations
* decorative elements that reduce clarity

Do not make every section look like an isolated component.

Use whitespace, typography, alignment, grouping, and hierarchy before adding borders or cards.

Prefer a clean layout with a strong structure over a collection of visually decorated containers.

---

# 3. Visual Hierarchy

Establish hierarchy through:

* size
* weight
* spacing
* position
* contrast
* grouping

Do not rely only on color to establish importance.

A user should be able to quickly identify:

1. What page they are on
2. What the most important information is
3. What they should do next
4. What is secondary information

Every screen should have a clear primary action when appropriate.

Do not give multiple actions equal visual importance unless they are genuinely equal.

---

# 4. Typography

Use the typography system defined by the project design system.

Do not introduce random fonts.

Use a limited and intentional type scale.

Avoid:

* too many font sizes
* too many font weights
* unnecessary uppercase text
* overly large headings
* tiny low-contrast supporting text

Text should remain readable at realistic content lengths.

Design for:

* short labels
* long labels
* long user names
* long titles
* multiple lines of text
* translated or expanded text

Do not truncate important information without providing a way to access it.

---

# 5. Spacing and Alignment

Use a consistent spacing system.

Align elements intentionally.

Prefer a clear grid and predictable spacing relationships.

Do not manually create slightly different spacing values throughout the interface.

Use whitespace to group related information and separate unrelated information.

Before adding a border, card, or background color to create separation, first consider whether spacing alone can create sufficient grouping.

Avoid both:

* cramped interfaces
* excessive empty space

The amount of whitespace should reflect the importance and density of the content.

---

# 6. Responsive Design

Every interface must work across:

* mobile
* tablet
* laptop
* large desktop screens

Do not treat responsiveness as an afterthought.

Design the layout so it adapts naturally rather than simply shrinking the desktop interface.

Test for:

* narrow mobile screens
* common laptop widths
* large monitors
* very wide screens

Avoid unintended horizontal scrolling.

Ensure that text, tables, forms, navigation, and interactive controls remain usable on smaller screens.

Do not hide critical functionality simply because the screen is smaller.

When space is constrained:

1. prioritize important content
2. simplify the layout
3. collapse secondary controls
4. provide appropriate overflow patterns

Do not simply make everything smaller.

---

# 7. Interaction Semantics

Use the correct HTML element for the correct behavior.

Use:

* `<button>` for actions
* `<a>` for navigation
* form elements for user input
* semantic headings for content hierarchy
* semantic HTML wherever possible

Do not use clickable `<div>` elements when a native interactive element is appropriate.

Do not use ARIA to replace semantic HTML when semantic HTML already provides the required behavior.

Native behavior should be preserved wherever possible.

---

# 8. Accessibility

Every interactive interface must be keyboard accessible.

Ensure:

* logical keyboard navigation
* visible focus indicators
* no keyboard traps
* accessible labels for inputs
* accessible names for icon-only controls
* sufficient contrast
* meaningful error messages
* correct semantic structure

Do not rely only on:

* color
* icons
* position
* animation

to communicate important meaning.

If an action or status is communicated visually, ensure that the information is also understandable through text, semantics, or another accessible mechanism.

Use ARIA only when necessary.

---

# 9. Touch Targets

Interactive elements must be comfortably usable on touch devices.

Use sufficiently large touch targets, generally targeting approximately 44 × 44 CSS pixels where appropriate.

Do not make icons difficult to tap merely to achieve a visually compact design.

The clickable area can be larger than the visible icon.

---

# 10. Buttons and Actions

Use buttons consistently according to their importance.

Establish clear distinctions between:

* primary actions
* secondary actions
* tertiary actions
* destructive actions

There should generally be one visually dominant primary action within a given context.

Avoid presenting every action as a primary button.

Button labels should describe the action.

Prefer:

* `Save changes`
* `Create project`
* `Download report`

over vague labels such as:

* `Submit`
* `Continue`
* `Click here`

unless the context makes the action completely obvious.

For destructive actions:

* make consequences clear
* provide confirmation when necessary
* consider Undo where appropriate

Do not require confirmation for every action.

---

# 11. Navigation and URLs

Navigation should use real links.

Application state that users reasonably expect to preserve or share should be reflected in the URL where appropriate.

Examples may include:

* selected tabs
* filters
* search queries
* pagination
* selected resources

Users should be able to:

* bookmark meaningful application states
* use browser back and forward navigation naturally
* share relevant URLs when appropriate

Do not put every temporary UI state into the URL.

Use judgment based on whether the state is meaningful beyond the immediate interaction.

---

# 12. Forms

Forms should:

* have clear labels
* communicate required fields clearly
* provide helpful validation
* preserve user-entered data where possible
* make errors easy to understand
* indicate successful completion clearly

Do not clear a form after an error unless there is a strong reason.

Validate at appropriate moments.

Avoid showing errors before the user has had a reasonable opportunity to complete an input.

Error messages should explain:

1. what is wrong
2. how to fix it

Do not display generic messages such as:

`Invalid input`

when a more useful explanation can be provided.

---

# 13. Loading States

Every asynchronous experience should have an intentional loading state.

Choose the loading pattern based on context:

* skeletons for predictable content layouts
* spinners for short indeterminate waits
* progress indicators for measurable long-running tasks

Do not use fake progress.

Loading states should preserve the expected layout when possible and minimize layout shifts.

Avoid blank screens during loading unless the content genuinely cannot be represented yet.

Do not block the entire interface when only one part of the page is loading.

---

# 14. Empty States

Design intentional empty states.

An empty state should explain:

* what is currently empty
* why it may be empty
* what the user can do next, when applicable

Do not use generic illustrations as a substitute for useful guidance.

An empty state does not always require an image or illustration.

Keep the message proportional to the importance of the situation.

---

# 15. Error States

Errors should be specific and actionable.

Whenever possible, tell the user:

* what happened
* whether their data was affected
* what they can do next

Provide a retry mechanism when retrying is appropriate.

Do not silently fail.

Do not expose raw technical errors to users unless the interface is explicitly intended for developers.

For unrecoverable failures, preserve useful user context and entered data whenever possible.

---

# 16. Success and Feedback

Every meaningful user action should receive appropriate feedback.

Use:

* inline feedback for local actions
* status changes when the result is persistent
* toasts for transient, non-critical feedback
* progress indicators for ongoing work

Do not show a toast for every interaction.

Feedback should be proportional to the action.

Avoid noisy interfaces where every click produces a notification.

---

# 17. Optimistic Updates

When an action is likely to succeed and immediate feedback improves the experience, consider optimistic updates.

The interface should:

1. update immediately
2. communicate the new state clearly
3. recover gracefully if the operation fails

Do not use optimistic updates when incorrect temporary information could cause serious confusion or consequences.

---

# 18. Destructive Actions

Clearly distinguish destructive actions from ordinary actions.

Examples include:

* Delete
* Remove
* Cancel subscription
* Revoke access

For significant or irreversible actions:

* communicate the consequence before completion
* use confirmation when appropriate
* provide Undo when practical

Avoid unnecessary confirmation dialogs for low-risk actions.

The goal is not to add friction; it is to prevent costly mistakes.

---

# 19. Motion and Animation

Animation must have a purpose.

Use motion to:

* communicate state changes
* establish spatial relationships
* provide feedback
* guide attention when necessary

Do not animate purely to make the interface appear more impressive.

Respect `prefers-reduced-motion`.

Prefer performant animation properties such as:

* `transform`
* `opacity`

Avoid:

* `transition: all`
* unnecessary continuous animation
* long delays
* distracting motion
* excessive bouncing
* animations that block user interaction

Interfaces should feel responsive.

Do not make users wait for an animation before they can continue.

---

# 20. Performance

Do not sacrifice performance for decorative effects.

Consider:

* unnecessary client-side JavaScript
* oversized images
* unnecessary re-renders
* expensive animations
* layout shifts
* blocking interactions

Reserve space for images and asynchronously loaded content where possible to reduce layout shift.

Optimize visible and critical content first.

A simple, fast interface is preferable to a visually elaborate but slow interface.

---

# 21. Images and Media

Images must serve a purpose.

Do not add stock images merely to fill space.

Provide appropriate sizing and reserved layout space to prevent layout shifts.

Use meaningful alternative text when an image communicates information.

Decorative images should not create unnecessary noise for assistive technologies.

Do not rely on an image alone to communicate essential information.

---

# 22. Icons

Use icons when they improve recognition or reduce cognitive load.

Do not use icons as decoration.

For icon-only controls:

* provide an accessible name
* provide a tooltip when the meaning may not be obvious
* ensure the target is easy to interact with

Use a consistent icon family and visual style throughout the application.

Do not mix unrelated icon styles.

---

# 23. Tables and Dense Data

Design data-heavy interfaces for real usage.

Ensure:

* headers remain understandable
* important columns are prioritized
* values align consistently
* overflow is handled intentionally
* mobile behavior is considered

Do not automatically turn every table into cards on mobile.

Choose the responsive behavior based on the data and user task.

Possible approaches include:

* horizontal scrolling
* hiding secondary columns
* progressive disclosure
* a different mobile representation

Preserve the ability to compare information when comparison is the primary task.

---

# 24. Content Resilience

Assume real data will be imperfect.

Test the interface with:

* very short content
* very long content
* missing data
* zero values
* large numbers
* unexpected values
* slow responses
* failed responses

Do not design only for ideal placeholder content.

The interface should remain usable when real-world data is messy.

---

# 25. Component Reuse

Before creating a new component:

* check whether an existing component already solves the problem
* reuse established interaction patterns
* extend existing components when appropriate

Do not create near-duplicate components with small visual differences.

However, do not force unrelated use cases into one overly complex "universal" component.

Prefer composable components with clear responsibilities.

---

# 26. Consistency

Maintain consistency in:

* spacing
* typography
* button behavior
* form behavior
* iconography
* terminology
* status indicators
* navigation patterns
* feedback patterns

If a pattern already exists, reuse it unless there is a clear usability reason to introduce a different one.

Consistency reduces cognitive load.

---

# 27. Do Not Implement Placeholder UX

Do not leave production-facing interactions incomplete.

Avoid:

* buttons that do nothing
* fake controls
* non-functional search bars
* fake filters
* fake pagination
* decorative charts with no meaningful data behavior

If a feature is visually represented as interactive, implement the interaction or clearly mark it as unavailable when appropriate.

---

# 28. Final UI Audit

Before considering a UI task complete, perform a self-review.

## Product

* Is the primary user goal obvious?
* Is the primary action clear?
* Is anything visible without serving a purpose?
* Can any complexity be removed?

## Visual Quality

* Is the hierarchy immediately understandable?
* Is alignment intentional?
* Is spacing consistent?
* Are cards, borders, shadows, and colors necessary?
* Does the interface avoid generic AI-generated visual patterns?

## Responsive Behavior

* Does it work on mobile?
* Does it work on laptop screens?
* Does it work on large screens?
* Is there unintended horizontal scrolling?
* Does long content break the layout?

## Accessibility

* Can the interface be used with a keyboard?
* Are focus states visible?
* Are semantic HTML elements used correctly?
* Are interactive controls accessible?
* Is important meaning communicated without relying only on color?

## States

Verify relevant states:

* loading
* empty
* populated
* error
* success
* disabled
* hover
* focus
* active

## Interaction

* Are buttons used for actions?
* Are links used for navigation?
* Do destructive actions have appropriate safeguards?
* Does the browser back button behave naturally?
* Is important persistent state reflected in the URL where appropriate?

## Motion

* Does every animation serve a purpose?
* Is `transition: all` avoided?
* Are animations performant?
* Is reduced motion respected?

## Performance

* Is unnecessary code avoided?
* Are layout shifts minimized?
* Are images and assets appropriately handled?
* Does the interface feel responsive?

---

# Final Principle

Do not optimize for "making the UI look impressive."

Optimize for making the interface feel:

* intentional
* clear
* trustworthy
* responsive
* easy to use
* consistent
* polished

A high-quality interface is not defined by how many visual effects it contains.

It is defined by how little unnecessary friction the user experiences.

When in doubt, choose the solution that is simpler, clearer, more accessible, and more consistent with the existing product.
