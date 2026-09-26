# Lumbre Responsive UI Audit

Audit date: 2026-09-25  
Scope: public home experience at desktop and mobile viewports

## Outcome

The primary page sections now use a viewport-based rhythm without forcing
content into a fixed-height container. Each section has a minimum height of the
current small viewport minus the sticky header (`100svh - header height`) and is
allowed to grow when its catalog or interactive workflow needs more space. This
avoids clipped content, nested scroll traps, and mobile-browser toolbar jumps.

The implementation is protected by `UI-058` at desktop and 390 x 844 mobile
viewports. `UI-028` independently protects against horizontal overflow.

## Findings and remediation

| Area | Finding | Remediation | Status |
| --- | --- | --- | --- |
| Section rhythm | Short sections did not fill a viewport and anchors could land under the header. | Applied `svh` minimum heights and one header-aware scroll offset. | Resolved |
| Information architecture | “Method” and “Field knowledge” repeated the same promise and guidance. | Merged both into one `#metodo` section and renumbered the content sequence. | Resolved |
| Mobile navigation | The desktop navigation disappeared below 850 px without an equivalent complete menu. | Added a native disclosure menu with section, cart, and account access. | Resolved |
| Recipe pagination | All 17 page buttons competed for space and attention. | Kept first, last, current, and adjacent pages with ellipsis separators. | Resolved |
| Store continuity | The store introduction became detached from a long product grid. | Made the introduction sticky on desktop and static on mobile. | Resolved |
| Keyboard focus | Focus depended on browser defaults and was not visually consistent. | Added a high-contrast `:focus-visible` indicator to interactive controls. | Resolved |
| Motion preferences | Smooth scrolling and transitions ignored reduced-motion preferences. | Added a `prefers-reduced-motion` override. | Resolved |
| Anonymous blends | Public visitors were blocked or created server-owned hypotheses. | Added an isolated `sessionStorage` archive; no account or hypothesis mutation occurs. | Resolved |
| Fire presets | Loading a preset could appear to do nothing when values already matched. | Loading now recalculates the recommendation, confirms the action, and scrolls to the result. | Resolved |

## Standards baseline

- [WCAG 2.2, Success Criterion 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): content must remain usable without two-dimensional scrolling at the supported narrow viewport.
- [WCAG 2.2, Success Criterion 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible): keyboard-operable controls expose a visible focus indicator.
- [WCAG 2.2, Success Criterion 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum): compact controls retain at least the minimum target area or sufficient spacing. Lumbre uses 44 px for primary mobile navigation and pagination targets where practical.
- Semantic native controls (`button`, `a`, `details`, `summary`, labeled form fields) remain the first choice so keyboard and assistive-technology behavior is not recreated in JavaScript.

## Deliberate constraints

- “One screen per section” means **at least** one current viewport, not a fixed
  height. Recipes, the laboratory, and the store are content collections and
  must grow vertically without clipping.
- The desktop store heading is sticky only while its own section is in view.
- Anonymous blends are deliberately not synchronized, published, or promoted
  to “Mis blends.” Closing the browser session removes them.
- Account-owned blends and local anonymous blends remain different product
  concepts and different persistence boundaries.

## Regression checklist

1. Run `UI-018`, `UI-019`, `UI-028`, `UI-033`, and `UI-058` after modifying
   persistence, navigation, section layout, or responsive breakpoints.
2. Validate at 390 x 844 and at the default desktop viewport.
3. Confirm `document.documentElement.scrollWidth <= clientWidth`.
4. Confirm the public blend flow emits no `POST /api/hipotesis` or
   `POST /api/account/blends` request.
5. Confirm preset loading changes the fields and immediately renders a fire
   recommendation.
