# Mobile Prototype Agent Guide

## Prototype Instructions

In ChatGPT Work Mode, run `sites-preview start "$PWD"`, open `http://terminal.local:4173/` in the cloud browser, and verify the rendered app and its primary interactions. Keep that preview open and tell the user to inspect it in the cloud browser; do not present the local URL as a user-facing chat link. In Codex Desktop, run the local server yourself, open the preview in the in-app browser, and provide the clickable local URL. Do not deploy to Sites unless the user explicitly asks to share, publish, or deploy. Do not give the user server-start instructions when you can run it.

Before planning or implementing any mobile-app change, read this `AGENTS.md` in full. It is the source of truth for the template's runtime and component guidance.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## NASQO Reference States

- Preserve the ten selected reference states: purchases creation menu, export side menu, activation modal, account picker, dense supplier statement, new transaction modal, compact account creation, extended account creation, currency exchange, and WhatsApp notification settings.
- Also preserve the third five-state set: extended account creation over the shop account list, the expanded opening-balance variant, invoice creation over the dashboard, warehouse creation over the warehouse list, and inventory movement report with its four-item export menu.
- Preserve the fourth five-state set: compact account creation, the orange-label account picker, the dashboard's nine-item upper-left add menu, the purchases five-item export/import menu, and the selected supplier's six-item operations menu over a scrolled list.
- Preserve the fifth pair: the eight-card dashboard and its right-side navigation drawer. Use the reference card order (sales/purchases, clients/employees, transfers/shop, measurements/new measurement), red/green balances without metadata, nine compact quick actions, and the small version/link footer. Keep NASQO's own version and brand assets.
- Preserve the sixth five-state set: the cash-purchases supplier statement, the closed purchases list, and the three continued drawer views covering warehouses/accounts/backups, cloud/photo backup controls, and help/about actions. Drawer headings and rows remain part of one scroll surface beneath the fixed toolbar.
- Preserve the seventh five-state set: the simple-entry screen, the cash supplier statement scrolled to older transactions with its six-item operations menu, the purchases export menu, and the drawer's backup and help/about scroll states. The latest three attachments repeat the cash menu, purchases export and simple-entry references; they refine those same states rather than adding separate screens.
- Preserve the eighth three-state set: the cash statement currency dropdown, its nine-criterion search menu over a long transaction, and the landscape cash-purchase invoice preview. The two supplied invoice images are duplicates of the same document state.
- The cash currency overlay has five centered text options: ريال, عملة 2, دولار, جميع العملات بدون مصارفة, and مصارفة الكل بعملة ريال. The search menu is a separate upper-left text-only overlay containing all, number, description, document number, sender, recipient, company, debit amount and credit amount criteria. Keep both menus local and keep the ledger's fixed filters and totals visible.
- The landscape invoice preview is rendered document content with a bilingual business header, bordered title/banner, date and number, recipient, five-column RTL item table, quantities, totals and amount in words. Transaction 1140 uses two illustrative one-unit lines of 1,500 each and a 3,000 total. Preserve NASQO's explicit preview banner and keep document zoom/navigation inside the prototype; no actual printing, downloading, sharing, file creation or accounting write is implied.
- Simple entry is a full screen with separate from/to account search and selection controls, orange balance strips, an account-swap action, amount and currency, description, document number, and bottom save/cancel actions. Its fields and account selection remain local demonstration state; a save must not create a real ledger entry.
- The cash statement operations menu is a text-only lower-left overlay roughly 48% of the screen wide with six approximately 45px rows. It sits above the fixed totals footer without dimming the ledger, retains the cash supplier context, and uses invoice, return, transfer, currency exchange, quote and order actions. Older demonstration rows must be scrollable beneath the fixed filters/table heading; preserve the first six cash rows as well.
- The cash supplier has a distinct statement with blue cash transaction types/amounts/dates, zero running balances, multiline details and six visible representative rows. Preserve the existing credit-supplier statement separately. Cash totals are demonstration period totals, not a claim that the displayed six rows sum to the complete ledger.
- Backup, restore, cloud, image sharing, import, update and contact items remain local preview actions. Their presence must not initiate actual file selection, account linking, uploads, restores, messages or production writes. Retain NASQO identity/library icons and an honest preview response for unsupported destinations.
- The navigation drawer starts beneath the full-width toolbar, occupies roughly 84.4% of the screen, and scrolls as one surface including its brand hero. Its first nine entries are language/appearance, notifications, SMS, WhatsApp, reports, quotes, orders, trash, and settings, followed by the warehouse group. Existing activation remains reachable further down; no live WAHA status is implied by this design.
- Keep these menus distinct: the dashboard menu is text-only with nine actions; purchases exports include PDF print/share, Excel export/share, and account import; the contextual supplier menu contains invoice, return, transfer, currency exchange, quote, and order actions. Invoice/return/quote/order and currency exchange retain the selected supplier context.
- The purchases filter panel stays fixed beneath its toolbar while the denser supplier list scrolls. Keep card number badges, approximately 70px card height, and 10px gaps; enough mock suppliers should exist to demonstrate the scrolled state. Import/export controls remain demonstrative feedback without reading files, creating files, or making network requests.
- Account opening-balance controls must expand within the same centered modal and expose amount, currency, opening description, and debit/credit choice. Initial messaging selections are SMS and “لا ترسل”; the reference expanded state uses WhatsApp and “بعد التأكيد”. These remain local prototype selections.
- Invoice item/free-form, cash/credit, and purchase/sale choices are independent groups. Inventory report exports contain only PDF print/share and Excel export/share; statement balance-confirmation actions do not belong in this menu.
- Match their layout, density, and financial color semantics while keeping NASQO branding and library icons; do not copy the reference application's logo or legacy clipart.
- Keep live device/form times, mock account names, and protected device chrome; these are documented differences from the reference screenshots rather than a claim of pixel-for-pixel identity.
- Prototype actions must remain demonstrative: no real message, activation request, or export side effect is allowed unless the user explicitly asks for live behavior.

## Editing Boundary

- Build app-specific UI in `src/Prototype.tsx` and `src/prototype.css`.
- Treat `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/mobile/`, `public/assets/iphone/`, `public/assets/android/`, `public/assets/status/`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs` as protected runtime files. Do not edit, replace, remove, or recreate them unless the user explicitly asks to change the mobile runtime itself. For an explicit runtime change, update the affected lock hashes only after verifying the new runtime behavior.
- Run `npm run check:runtime` before preview or handoff. If it fails, restore the protected runtime instead of weakening or bypassing the check.
- `npm run build` preserves the mobile runtime and prepares the static Cloudflare Worker output required by Sites. Before a Sites handoff, confirm `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`, and source `.openai/hosting.json` exist, then run `npm run test:sites`. Do not replace this project with a Vinext starter.

## Runtime Contract

- Preserve the mobile device runtime unless the user's task explicitly asks otherwise. Do not replace it with a standalone page. Visual fidelity applies to app-owned content inside the device screen, not to template-owned device chrome.
- Keep `App` composed around `PhoneFrame` -> `KeyboardProvider`, with `StatusBar`, app content, `HomeIndicator`, and `KeyboardDock` mounted inside the phone frame. `StatusBar` and the iOS home indicator are overlaid device chrome. When the Android keyboard is closed, the app viewport reserves the protected navigation-bar region instead of painting behind it. When the Android keyboard is open, preserve the current full-screen keyboard layout: its asset includes the IME navigation strip and the separate black navigation bar is hidden. iOS screens continue to paint behind the home-indicator area and own their safe-area content padding.
- Preserve the `iPhone` / `Pixel 10` device picker and both calibrated device presets. The Pixel screen is `427 x 952`; its `32 x 32` camera circle and `public/assets/android/navigation-bar.svg` bottom navigation bar are protected device chrome, not app content.
- Preserve the device picker's intentionally lightweight Codex styling in the top-right corner: its trigger wrapper is borderless and transparent, its trigger sizes to content, and its right-aligned menu uses the compact 3px inset plus the specified hairline and elevation shadow layers. Keep the prototype root and default app screen white.
- Preserve `StatusBar` as live device chrome, including its platform-specific typography, source status-icon assets, and spacing. Pixel 10 uses Roboto, Android indicators, and 32px top, left, and right padding. iPhone uses its iOS indicators, system typography, and calibrated spacing. Do not hardcode screenshot times like `9:41` into the status bar, replace its real-time clock, or move status bar content into app markup unless the user explicitly asks for a fixed/mock device time.
- `PhoneFrame` owns the calibrated device frame, screen portal, device picker, camera cutout, and custom cursor. Keep device assets in `public/assets/iphone/` and `public/assets/android/`; if an asset fails to load, repair the asset path or restore the asset instead of removing the frame, keyboard, or image render.
- Use `MobileScroll` directly for simple single-screen prototypes. Use `FlowStack` for conventional multi-screen flows whose routes can own their fixed header and footer; when using it, define each route as a `FlowScreen`: `{ id, header?, headerHeight?, footer?, footerHeight?, render }`, and use `flow.push(screen)`, `flow.pop()`, and `flow.replace(screen)` from `FlowStack` render callbacks or `useFlow()` instead of introducing another router.
- Use `Carousel` for a carousel, horizontal rail, swipeable cards, image or media strip, horizontally scrollable cards, chip rail, or other horizontal collection.
- For a layered app shell—such as a persistent composer, independently presented sheet, pushed/peek sidebar, or app-wide transition—compose directly in `Prototype.tsx` rather than forcing it through `FlowStack`. Keep app-owned fixed chrome as sibling layers outside `MobileScroll`.
- When using `FlowScreen`, put route-owned fixed headers or footers in `FlowScreen.header` or `FlowScreen.footer`. Set `headerHeight` to the visible app-toolbar height; `FlowStack` adds the device's top safe-area/status-bar inset automatically. Do not include `StatusBar` or its height in the header. Set `footerHeight` to the full app-footer height. `FlowScreen.footer` is an overlay, not reserved layout space; screens using it must add their own bottom content padding such as `padding-bottom: calc(var(--flow-footer-height) + var(--mobile-safe-area-height) + 24px)` so final content can scroll above the footer while still painting behind it.
- Render only scrollable content inside `MobileScroll`; it is for content that should move with scroll and rubber-band overscroll. Keep app-owned headers, nav bars, tabs, composers, and overlays outside it. This keeps scroll physics, safe areas, keyboard insets, scrollbars, and drag click suppression active without letting content paint under fixed chrome.
- Buttons, links, cards, and images inside `MobileScroll` should still allow drag scrolling when the pointer moves beyond tap slop. Use `data-scroll-drag="ignore"` only for rare controls that must own the drag gesture themselves.
- Do not add `var(--keyboard-height)` to ordinary screen/content padding inside `MobileScroll`; the scroll viewport already shrinks above the simulated keyboard. For custom fixed composers, search bars, or toast chrome, use `useKeyboardInsets().bottomInset`. It is relative to the app viewport: Android returns `0` while the closed-keyboard viewport already reserves navigation, then returns the keyboard height while open; iOS continues to clear the home indicator while closed and ride directly above the keyboard while open. Do not pin custom bottom chrome to `bottom: 0` or only `keyboardHeight`.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for every text-entry control. A raw `input` or `textarea` disconnects focus, keyboard animation, safe-area insets, and attached surfaces.
- Use `BottomSheet` for phone-scoped sheets. Its props are `open`, `onOpenChange`, `title`, optional `description`, optional `snap`, and `children`; it renders through the phone screen portal and dismisses the keyboard before opening.

## Horizontal Carousels

- Use `Carousel` for horizontally draggable cards, images, media, chips, or other horizontal collections. Do not recreate these with `overflow-x`, custom pointer handlers, or a generic div.
- `Carousel` can be nested directly inside `MobileScroll`. It owns horizontal gestures and automatically yields vertical gestures to the parent.
- Never put `data-scroll-drag="ignore"` on or around a `Carousel`; doing so prevents vertical parent scrolling when a gesture begins inside it.
- Do not add CSS scroll snapping to `Carousel`; its runtime owns momentum and release motion.
- Use `data-scroll-drag="ignore"` only when a control must prevent parent scrolling in every drag direction.

See `src/mobile/COMPONENTS.md` for the full component and gesture contract.

## Keyboard Rule

The simulated keyboard is a separate top-layer component. Before presenting anything that behaves like iOS navigation or modal UI, dismiss it first.

Call `keyboard.hide()` before:

- pushing, popping, or replacing FlowStack routes
- opening bottom sheets, action sheets, dialogs, menus, or navigation sheets
- starting transitions where the destination should not inherit text-input focus

`FlowStack` already hides the keyboard for `push`, `pop`, and `replace`. `BottomSheet` already hides it before opening. If you add new modal/sheet/navigation primitives, follow the same rule.

When a composer, search surface, or other keyboard-attached component closes, call `keyboard.hide()` in the same event before changing that component's open state. Position attached surfaces from `useKeyboardInsets()` rather than a separate timer or visibility flag so both dismiss together.

When any text-entry control loses focus, dismiss the simulated keyboard. If the control is custom or does not use the runtime's keyboard-aware fields, handle its blur event and call `keyboard.hide()` explicitly. Keep the keyboard open only when focus is moving directly to another text-entry control that should share the same keyboard session.

## Interaction Rules

- Do not trigger buttons or inputs after a pointer has become a drag. Preserve the drag suppression behavior in `MobileScroll`.
- Do not allow native browser image/file dragging inside the phone frame. Preserve the phone-level `dragstart` suppression and non-draggable image styles so scroll drags that begin on images still scroll the prototype.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for text entry so the simulated keyboard and safe-area insets stay connected.
- Fixed phone chrome should not animate with pushed screens. Screen content can animate; the status bar, camera cutout, and preview chrome should stay put.
- Keep the keyboard below the home indicator/safe area layer in z-index, and above ordinary app UI while visible.
- Keep the home indicator as the topmost safe-area layer in the z-index above everything else in the prototype.
