# UI Guidelines

This document defines the baseline UI and UX rules for the frontend application.

## Technology Standards

- All frontend code must be written in TypeScript (`.ts` and `.tsx`).
- New UI components must include strict, explicit prop types.
- Avoid introducing plain JavaScript files for UI logic unless there is a documented migration exception.

## Goals

- Keep the interface simple, focused, and fast.
- Ensure users can complete core tasks with minimal effort.
- Maintain consistent visuals and behavior across screens.
- Design for accessibility from the start.

## Design Principles

- Prioritize clarity over decoration.
- Use consistent spacing, typography, and interaction patterns.
- Make important actions visually prominent.
- Give immediate feedback for user actions.
- Avoid adding new patterns when an existing one already works.

## Layout and Spacing

- Use Tailwind spacing utilities mapped to theme variables (for example, `theme.spacing.*`).
- Do not use ad-hoc pixel spacing in component code when a theme spacing token exists.
- Use a consistent spacing scale from the shared theme (recommended: 4, 8, 12, 16, 24, 32).
- Align content to a clear grid and keep margins consistent.
- Keep line length readable (roughly 45 to 80 characters).
- Group related content with proximity and whitespace.

## Typography

- Use universal typography tokens from the shared theme across all pages and components.
- Use one primary font family defined by the theme for all UI text.
- Keep a clear type scale with predictable steps based on theme typography tokens.
- Do not hardcode font sizes, weights, or line heights in components unless explicitly approved.
- Recommended baseline:
  - `h1`: 32px, semibold
  - `h2`: 24px, semibold
  - `h3`: 20px, semibold
  - Body: 16px, regular
  - Helper text: 14px, regular
- Keep body text high contrast and easy to scan.

## Color and Contrast

- Use color variables from the theme palette for all UI colors.
- Do not hardcode raw hex/rgb/hsl values in components when a theme token exists.
- Define semantic color tokens from the palette:
  - Primary
  - Secondary
  - Success
  - Warning
  - Error
  - Surface and background
- Meet WCAG contrast minimums:
  - Normal text: at least 4.5:1
  - Large text: at least 3:1
- Never rely on color alone to communicate meaning.

## Components and States

- Reuse shared components where possible.
- Every interactive element must support visible states:
  - Default
  - Hover
  - Focus
  - Active
  - Disabled
  - Error (when applicable)
- Buttons:
  - Use a single primary button per section.
  - Keep labels action-oriented (for example, "Add Task").
- Forms:
  - Always show labels.
  - Place validation near the relevant field.
  - Use inline help text only when needed.

## Accessibility

- Ensure full keyboard navigation support.
- Provide visible focus indicators.
- Use semantic HTML before ARIA.
- Add ARIA attributes only when native semantics are insufficient.
- Ensure form controls have associated labels.
- Provide alternative text for meaningful images.

## Responsive Behavior

- Design mobile-first and scale up.
- Support common breakpoints (for example, 480px, 768px, 1024px).
- Explicitly support 1080 resolution in both portrait and landscape orientations for desktop layouts.
- Explicitly support 1080 resolution in both portrait and landscape orientations for tablet layouts.
- For mobile layouts, prioritize the most-used device resolutions based on current analytics and market usage.
- Revalidate supported mobile resolutions periodically as usage trends change.
- Avoid horizontal scrolling on small screens.
- Keep touch targets at least 44px by 44px.

### Supported Viewport Matrix

Use this matrix as the default responsive testing baseline.

| Device Class | Orientation | Viewport (w x h) | Example Devices | Priority |
| --- | --- | --- | --- | --- |
| Desktop | Landscape | 1920 x 1080 | FHD laptop and monitor | Required |
| Desktop | Portrait | 1080 x 1920 | Rotated external monitor | Required |
| Tablet | Landscape | 1920 x 1080 | Large tablet and foldable tablet modes | Required |
| Tablet | Portrait | 1080 x 1920 | Large tablet portrait mode | Required |
| Mobile | Portrait | 390 x 844 | iPhone 12/13/14 | Required |
| Mobile | Portrait | 393 x 852 | Pixel 7/8 | Required |
| Mobile | Portrait | 360 x 800 | Common Android mid-range baseline | High |
| Mobile | Portrait | 375 x 667 | iPhone SE / older iPhone baseline | High |
| Mobile | Portrait | 412 x 915 | Pixel XL / large Android baseline | High |
| Mobile | Landscape | 844 x 390 | iPhone 12/13/14 landscape | Medium |
| Mobile | Landscape | 852 x 393 | Pixel 7/8 landscape | Medium |

Notes:

- Keep this list aligned with product analytics at least once per quarter.
- If analytics show a different top mobile resolution group, replace lower-priority rows first.

## Motion and Feedback

- Use animation only when it improves comprehension.
- Keep transitions short and subtle (about 150 to 250ms).
- Respect reduced motion preferences.
- Show loading, success, and error feedback for async actions.

## Content and Microcopy

- Use plain, direct language.
- Prefer sentence case for labels and headings.
- Keep error messages specific and actionable.
- Avoid jargon and ambiguous button text like "Submit" when a clearer verb is possible.

## Testing and Review Checklist

Before merging UI changes, verify:

- Consistency with existing components and patterns.
- Keyboard navigation and focus order.
- Contrast and readability.
- Responsiveness on mobile and desktop sizes.
- Behavior at 1080 portrait and landscape for desktop and tablet.
- Behavior on the currently most-used mobile device resolutions.
- Empty, loading, success, and error states.
- Basic cross-browser behavior.

## Definition of Done for UI Work

A UI change is complete when:

- It matches these guidelines.
- It passes accessibility and responsive checks.
- It includes any required component or style updates.
- It is covered by relevant frontend tests where practical.
