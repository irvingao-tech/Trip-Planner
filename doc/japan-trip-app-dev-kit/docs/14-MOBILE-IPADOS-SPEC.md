# 14 — Mobile and iPadOS Specification

## 1. Scope decision

The product is a responsive web app optimized for iPhone and iPad Safari. It may be installed to the Home Screen as a PWA. Native SwiftUI, App Store packaging and native-only APIs are outside the MVP unless a later product decision adds them.

The same domain services, repositories and UI components serve phone, tablet and desktop layouts.

## 2. Supported layout classes

| Layout class | Effective CSS width | Typical use | Navigation | Primary content |
| --- | ---: | --- | --- | --- |
| Compact | 320–767 px | iPhone, iPad split view | Bottom nav | Single pane |
| Medium | 768–1023 px | iPad portrait | Bottom nav or compact rail | List/detail or switchable itinerary/map |
| Expanded | >= 1024 px | iPad landscape, desktop | Sidebar | Itinerary/map split |

These are width-based layout classes, not user-agent checks. The UI must respond correctly when browser chrome, multitasking or split view changes the effective width.

## 3. Global layout rules

- No unintended horizontal page scrolling at 320 CSS px or wider.
- Use fluid widths and `minmax()` rather than fixed desktop panel widths.
- Use `100dvh` for full-screen mobile surfaces with a `100vh` fallback.
- Apply `env(safe-area-inset-top/right/bottom/left)` to fixed bars, sheets and edge-to-edge screens.
- Fixed navigation must reserve content space so it never covers the last actionable item.
- Preserve domain/form state when a responsive breakpoint changes.
- Do not lock screen orientation.

## 4. Input and interaction

- Minimum touch target: 44 x 44 CSS px.
- No action may require hover, right-click, precise pointer placement or drag alone.
- Drag/reorder must also expose move-up and move-down controls with accessible labels.
- Swipe gestures are enhancements, never the only route to an action.
- Text inputs should render at least 16 CSS px on compact layouts to avoid involuntary Safari zoom.
- Use appropriate input modes (`numeric`, `decimal`, `search`, date/time where suitable).
- Keep the focused control and primary submit action visible when the software keyboard opens.
- Destructive actions require a clear label and confirmation or an easy undo path.

## 5. Navigation by layout

### Compact

- Bottom destinations: Today, Plan, Map, Places, More.
- Today is the default during an active trip.
- Secondary pages use a visible back action and preserve bottom-nav context where appropriate.
- More contains Shopping, Notes and settings rather than overcrowding the bar.

### Medium

- Prefer a compact navigation rail or bottom navigation based on usable height.
- Use list/detail layouts for Places and Shopping when the detail pane remains useful.
- Itinerary and map may toggle or split; neither pane should become an unusably narrow desktop column.

### Expanded

- Use the sidebar plus itinerary/map split described in doc 02.
- Pointer hover may enhance selection, but tap/click and keyboard behavior remain complete.

## 6. Screen requirements

### Today

- Show current/next destination and its primary action without scrolling on common phone portrait sizes when practical.
- Expose Open in Maps, mark visited and quick notes as large touch actions.
- Route failure must remain visible and must not remove the destination details.

### Itinerary

- Timeline is single-column on compact screens.
- Day selector is horizontally scrollable with a visible selected state and keyboard support.
- Reordering scrolls safely near viewport edges and does not trigger browser navigation gestures.
- Fixed-time and warning states must not depend on color alone.

### Map

- Compact layout uses an edge-to-edge map with a bottom sheet.
- Sheet states: collapsed, half, expanded; each is reachable by tap as well as drag.
- Marker selection synchronizes with the sheet/list.
- All destinations and warnings remain accessible through a non-map list.

### Places and Shopping

- Forms may use a full-screen sheet/page on compact layouts.
- Save/cancel actions remain visible with the keyboard open.
- Card/table content collapses into labeled rows; never require horizontal table scrolling for core fields.

## 7. Accessibility

- Meet WCAG 2.2 AA for the MVP UI.
- Use semantic landmarks, headings, labels and live regions for async results.
- Visible focus indicators are required.
- Support keyboard navigation on iPad hardware keyboards and desktop.
- Respect reduced-motion preferences for sheets, map focus and reorder animations.
- Status, priority and warnings require text/icon cues in addition to color.

## 8. Performance budgets

Mobile networks and battery usage are product constraints.

- Today/list UI must render without waiting for the map bundle.
- Lazy-load map and external provider SDKs.
- Avoid route recomputation while dragging; recompute after drop.
- Compress and size trip/place images responsively.
- Define measurable bundle and Web Vitals budgets during Phase 0 once the actual Next.js baseline is generated.

## 9. PWA boundary

Phase 1 should include:
- web app manifest
- application icons
- theme and background colors
- standalone-safe navigation and safe-area styling

Offline caching, background sync, push notifications and install-prompt UX are later features. Local persistence alone must not be described as full offline support.

## 10. Acceptance matrix

Minimum automated viewport coverage:
- Compact: 390 x 844
- Medium: 768 x 1024
- Expanded/tablet landscape: 1024 x 768
- Desktop: 1440 x 900

Minimum manual Safari coverage before release:
- smallest supported iPhone-sized viewport (320 CSS px wide)
- current iPhone portrait and landscape
- iPad portrait and landscape
- iPad split view at compact/medium effective widths
- normal Safari tab and Home Screen standalone mode

Every UI phase must verify:
1. Primary flow completion without hover.
2. No clipped content or unintended horizontal scrolling.
3. Safe-area and software-keyboard behavior.
4. State preservation across rotation/resizing.
5. Touch target and focus behavior.
6. Loading, empty and error states at compact and tablet widths.
