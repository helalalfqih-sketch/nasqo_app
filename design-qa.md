# NASQO Pro — Design QA

## Source visual truth

Reference directory: `work/references/images`

Primary state matches:

- Dashboard: `02-1000549900.jpg`
- Navigation drawer: `01-1000549907.jpg` and `04-1000549908.jpg`
- Purchases / supplier accounts: `01-1000559708.jpg`
- Supplier statement: `06-1000549915.jpg`

Selected five-state refinement set (exact user attachments):

- Purchases creation menu: `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/a83b9cb4-47da-4ece-b68d-bed263c067c8/1-1000559708.jpg`
- Export side menu: `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/a83b9cb4-47da-4ece-b68d-bed263c067c8/2-1000552473.jpg`
- Activation modal: `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/a83b9cb4-47da-4ece-b68d-bed263c067c8/3-1000552474.jpg`
- Account picker modal: `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/a83b9cb4-47da-4ece-b68d-bed263c067c8/4-1000552470.jpg`
- Dense supplier statement: `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/a83b9cb4-47da-4ece-b68d-bed263c067c8/5-1000552471.jpg`

Second five-state refinement set (exact user attachments):

- New transaction modal: `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/5be0dc63-ccec-41f2-b8da-882ca5527532/1-1000552472.jpg`
- Compact account creation modal: `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/5be0dc63-ccec-41f2-b8da-882ca5527532/2-1000552469.jpg`
- Extended account creation modal: `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/5be0dc63-ccec-41f2-b8da-882ca5527532/3-1000552467.jpg`
- Full currency exchange screen: `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/5be0dc63-ccec-41f2-b8da-882ca5527532/4-1000552468.jpg`
- Full WhatsApp notification settings screen: `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/5be0dc63-ccec-41f2-b8da-882ca5527532/5-1000552466.jpg`

The full supplied set was also reviewed for component and interaction coverage:

- `01-1000549907.jpg`
- `02-1000549900.jpg`
- `03-1000549909.jpg`
- `04-1000549908.jpg`
- `05-1000549910.jpg`
- `06-1000549915.jpg`
- `07-1000549914.jpg`
- `08-1000549936.jpg`
- `09-1000549926.jpg`
- `10-1000549944.jpg`
- `01-1000552467.jpg`
- `02-1000552466.jpg`
- `03-1000552469.jpg`
- `04-1000552468.jpg`
- `05-1000552470.jpg`
- `06-1000552471.jpg`
- `07-1000552472.jpg`
- `08-1000552473.jpg`
- `09-1000552474.jpg`
- `01-1000559708.jpg`
- `02-1000559707.jpg`
- `image(20261114-140236).png`

## Comparison setup

- Original reference set: 691 × 1536 px; both selected five-state sets: 576 × 1280 px. All references were normalized to 852px height while preserving aspect ratio.
- Implementation viewport: 393 × 852 px at device scale factor 1.
- Device chrome differences were excluded from app-layout findings because the source uses Android chrome and the preview frame uses an iPhone-style shell.
- Full-view comparisons:
  - `qa/comparison-dashboard.png`
  - `qa/comparison-purchases.png`
  - `qa/comparison-supplier.png`
  - `qa/comparison-drawer.png`
  - `qa/comparison-purchases-menu.png`
  - `qa/comparison-export-menu.png`
  - `qa/comparison-activation.png`
  - `qa/comparison-account-picker.png`
  - `qa/comparison-transaction-modal.png`
  - `qa/comparison-account-form-compact.png`
  - `qa/comparison-account-form-extended.png`
  - `qa/comparison-currency.png`
  - `qa/comparison-whatsapp-settings.png`
- Implementation captures:
  - `qa/implementation-dashboard.png`
  - `qa/implementation-drawer.png`
  - `qa/implementation-purchases.png`
  - `qa/implementation-purchases-menu.png`
  - `qa/implementation-supplier.png`
  - `qa/implementation-export-menu.png`
  - `qa/implementation-activation.png`
  - `qa/implementation-account-picker.png`
  - `qa/implementation-transaction-modal.png`
  - `qa/implementation-account-form-compact.png`
  - `qa/implementation-account-form-extended.png`
  - `qa/implementation-currency.png`
  - `qa/implementation-whatsapp-settings.png`

## Visual review

| Surface | Result | Notes |
| --- | --- | --- |
| Typography | Passed | Arabic RTL hierarchy, compact label sizing, centered KPI values, and dense statement rows now track the source closely while remaining readable. |
| Spacing and layout | Passed | The dashboard now starts directly with the 3 × 3 action grid, shows eight compact KPI cards, and uses the same dense two-column rhythm. Purchases, supplier rows, the creation menu, statement table, and drawer were compressed to match the source composition. The final refinement also aligned the density and vertical placement of the transaction/account modals and WhatsApp settings card. |
| Colors | Passed | Filled blue/orange quick actions, blue card outlines, blue date strips, red PDF actions, and green/red financial semantics map directly to the source palette. |
| Image and icon quality | Passed | Crisp library icons replace the source application's legacy clipart and logo; this is an intentional NASQO identity difference rather than a missing asset. No stretched or low-resolution artwork was introduced. |
| Copy | Passed | Arabic labels are concise and consistent. WAHA is explicitly marked as a preview state so the prototype does not claim a real connection. |

## Interaction review

- Dashboard quick actions open the appropriate sheet, supplier list, or feedback toast.
- Drawer opens and closes in RTL direction and hides a focused field before opening.
- Purchases period tabs expose selected state with `aria-pressed`.
- The purchases FAB opens an anchored eight-item creation menu matching the supplied open-menu state.
- Supplier cards have separate actions for opening the statement, call, edit, and message preview.
- The supplier statement presents eight compact rows with running balances under a four-column blue table header.
- New transaction moved from a bottom sheet to a centered modal over the supplier statement, matching the supplied state; save remains a safe local demo action.
- New account moved from a simplified bottom sheet to centered compact and extended account-form modal variants.
- Currency exchange moved from a bottom sheet to a complete full-screen exchange form; its account add action opens the extended account form.
- WhatsApp notification settings moved from a toast-only placeholder to a complete settings screen. Phone and password fields accept input, while save explicitly confirms that nothing was sent or persisted.
- Message and sharing actions explicitly state that no message was sent.
- Supplier statement, export side menu, activation modal, account picker, both account-form variants, transaction modal, currency screen, WhatsApp settings, and simulated mobile keyboard are covered by the primary flow.
- Back navigation was verified from supplier statement to purchases and then to dashboard.
- Browser console errors and page errors: none.

## Automated checks

- Mobile runtime integrity: passed; 28 protected runtime files unchanged.
- TypeScript and production build: passed.
- Playwright primary mobile flow: 1 passed.
- Exact preview screen assertion: 393 × 852 px.
- Expanded five-state capture and comparison rerun: passed after three iterations of spacing, alignment, action-order, and density fixes.
- Second five-state capture and comparison rerun: passed; final adjustments covered modal density and placement, the transaction backdrop, the full currency screen, and WhatsApp card positioning.

## Comparison history

1. Initial captures exposed two non-product artifacts: a missing favicon request and the preview runtime's visible touch cursor. Both were removed from the evidence captures.
2. The first comparison found P1 drift: a welcome block not present in the source, outlined 48px shortcuts instead of compact filled pills, only six airy KPI cards, simplified purchases filters, 122px supplier cards, card-based statement rows, and a compact drawer without a brand hero.
3. The dashboard was rebuilt around filled blue/orange actions and eight centered blue-outline KPI cards. The extra welcome block and most shadows were removed.
4. Purchases gained compact sort/currency controls, a blue date strip, 88px supplier rows, independent call/actions, and an anchored eight-item creation menu matching the source state.
5. The supplier statement was converted to a dense six-row table with a blue four-column header, blue dates, red PDF actions, and a fixed totals bar.
6. The drawer gained a large NASQO brand hero, flatter rows, gray icons, denser navigation, and an explicit preview-only WAHA status.
7. Post-fix captures were regenerated at 393 × 852 and compared side by side. Remaining differences are limited to protected device chrome, NASQO-specific icons/branding, and mock data labels; these are expected and acceptable.
8. Production build, runtime integrity, interaction test, console check, captures, and normalized comparisons all passed after the final menu-position fix.
9. The selected five-state refinement replaces the export bottom sheet with the reference-style upper-left side menu, widens and centers the purchases creation menu, adds the activation and account-picker modals, and upgrades the statement with eight rows, running balances, semantic amount colors, and three footer totals.
10. Final comparison aligned the purchases menu top/bottom bounds, export menu row density, activation hero/body proportions, account-picker action order and centering, statement action order, and transfer icon treatment with the supplied states.
11. The second five-state refinement replaces simplified bottom sheets with centered transaction and compact/extended account modals, promotes currency exchange to a complete screen, and replaces the WhatsApp toast with a complete settings screen. Save and messaging behavior remains safe and sends or persists nothing.
12. Final comparison aligned the transaction modal with the correct supplier-statement backdrop, tuned compact and extended modal density and placement, verified the complete exchange-screen rhythm, and corrected the WhatsApp card and back-control position. The regenerated implementation and comparison captures show no remaining P0, P1, or P2 visual issues.

## Third five-state refinement

Exact user attachments (relative to the chat workspace):

| Reference state | Attachment |
| --- | --- |
| Shop account creation, collapsed | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/bf700f8c-934c-42a3-bd42-1fd551f02d91/1-1000549955.jpg` |
| Shop account creation, opening balance expanded | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/bf700f8c-934c-42a3-bd42-1fd551f02d91/2-1000549956.jpg` |
| Invoice creation over dashboard | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/bf700f8c-934c-42a3-bd42-1fd551f02d91/3-1000549954.jpg` |
| Warehouse creation over warehouse list | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/bf700f8c-934c-42a3-bd42-1fd551f02d91/4-1000549953.jpg` |
| Inventory movement report and export menu | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/bf700f8c-934c-42a3-bd42-1fd551f02d91/5-1000549952.jpg` |

Evidence paths for this refinement:

| State | Implementation capture | Comparison board |
| --- | --- | --- |
| Shop account | `qa/implementation-shop-account.png` | `qa/comparison-shop-account.png` |
| Opening balance | `qa/implementation-opening-balance.png` | `qa/comparison-opening-balance.png` |
| Invoice modal | `qa/implementation-invoice-modal.png` | `qa/comparison-invoice-modal.png` |
| Warehouse modal | `qa/implementation-warehouse-modal.png` | `qa/comparison-warehouse-modal.png` |
| Inventory export | `qa/implementation-inventory-export.png` | `qa/comparison-inventory-export.png` |
| Inventory report, menu closed | `qa/implementation-inventory-report.png` | Covered by the report/export reference |

The source screenshots are 576 × 1280 px. Their visual targets include a roughly 343px-wide centered account modal that grows from approximately 367px to 481px when opening balance is enabled, a roughly 468px-high invoice modal, a compact 234px-high warehouse modal, and dense alternating cyan/white inventory rows. These are layout targets at the preview size, not assertions of identical device chrome or text metrics.

Verified behavior:

- Shop-account creation retains the correct account-list backdrop. Styled gray/orange switches replace checkbox-looking toggles; enabling opening balance reveals amount/currency, the default description “رصيد افتتاحي”, and debit/credit choices.
- Invoice creation has separate item/free-form, cash/credit, and purchase/sale groups, account selection, currency/rate, warehouse selection, and description fields.
- Warehouse creation is shown over the warehouse list. The report uses a full-screen table with a fixed blue totals footer and a context-specific four-item PDF/Excel export menu.
- NASQO branding and library icons, live times, mock account names, and protected mobile chrome intentionally differ from the source. These differences should remain explicit in the comparison; no pixel-for-pixel claim is made.

Findings and fixes from the first third-set pass:

1. The existing design flow passed, and the new account/invoice flow passed.
2. The warehouse flow failed because its sticky floating add button fell beneath the header. The button was changed to an absolute app-owned overlay, and the warehouse modal was moved into the app-root portal so it can cover the route consistently.
3. Initial visual comparison showed undersized extended-account labels and overly narrow content. The extended-form text sizing and available content width were increased.
4. The next comparison showed that the final inventory row was partly behind the fixed totals bar. Row height was reduced from 32px to 30px to accommodate the protected preview header; all 15 rows are visible in the final board. Account gaps and warehouse padding were also adjusted to bring the modal bounds closer to the references.
5. Final new-flow rerun: **2 passed (32.2s)**. The earlier existing primary flow also passed in this turn. The tests exercised invoice selections, opening-balance expansion/collapse and text entry, warehouse creation and default selection, report navigation, and the four-option export menu. No browser errors or external HTTP requests were recorded in the two new flows.
6. The final production build and integrity check passed; all 28 protected runtime files remain unchanged. The existing large-bundle advisory remains a nonblocking performance follow-up.
7. All five comparison boards were regenerated and opened after the final changes. An additional in-app-browser check opened the invoice modal on the user's selected Pixel 10 preview, with its radio defaults, account/currency/warehouse controls and actions visible.

Final fidelity review for the third set:

| Surface | Assessment |
| --- | --- |
| Typography | The enlarged account labels and invoice/report text are readable at the 393 × 852 preview size. The existing Segoe UI/Tahoma font stack and NASQO heading weight differ from the source's Android text rendering. Exact font-metric matching is a remaining minor refinement. |
| Layout and spacing | Centered collapsed/expanded account, invoice and warehouse modal proportions now track the reference. The report displays all 15 rows above the totals. App header offsets follow the protected device safe area. |
| Colors | Blue outlines/toolbars, orange selections and enabled switches, gray disabled switches, red/green financial choices, and alternating pale cyan rows preserve the reference semantics. |
| Icons and assets | Existing crisp library icons and NASQO identity are retained as specified in AGENTS.md. The source's legacy clipart and watermark are intentionally omitted. |
| Copy and controls | Reference form labels, opening-balance default description, report columns and four export actions are present. Account names are demonstration data, and dates use current preview time. |

Normalization: source 576 × 1280, proportional resize to 852px height; implementation element captures 393 × 852 CSS px at device scale factor 1 in a 1400 × 1200 browser viewport. The full comparison boards make individual labels and controls readable, so additional focused crops were unnecessary for this pass. Protected device chrome is excluded from app-layout judgments.

No remaining actionable P0/P1/P2 finding in these five visual states. P3 follow-ups: closer Arabic font metrics and legacy icon style, if desired. Production accounting, message delivery, persistent warehouse storage, and actual PDF/Excel generation remain outside this local interactive prototype; warehouse entries exist only while the preview route is mounted.

## Fourth five-state refinement

Exact user attachments (relative to the chat workspace):

| Reference state | Attachment |
| --- | --- |
| Compact account creation | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/48d3466d-0f79-432b-9cda-21e506c4dc61/1-1000549946.jpg` |
| Account picker with orange search label | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/48d3466d-0f79-432b-9cda-21e506c4dc61/2-1000549945.jpg` |
| Dashboard add menu | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/48d3466d-0f79-432b-9cda-21e506c4dc61/3-1000549944.jpg` |
| Purchases export/import menu | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/48d3466d-0f79-432b-9cda-21e506c4dc61/4-1000549936.jpg` |
| Selected supplier operations over scrolled purchases | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/48d3466d-0f79-432b-9cda-21e506c4dc61/5-1000549926.jpg` |

Evidence paths designated for this refinement:

| State | Implementation capture | Comparison board |
| --- | --- | --- |
| Compact account | `qa/implementation-account-compact-v4.png` | `qa/comparison-account-compact-v4.png` |
| Account picker | `qa/implementation-account-picker-v4.png` | `qa/comparison-account-picker-v4.png` |
| Dashboard add menu | `qa/implementation-dashboard-add-menu.png` | `qa/comparison-dashboard-add-menu.png` |
| Purchases exports | `qa/implementation-purchases-export.png` | `qa/comparison-purchases-export.png` |
| Supplier operations | `qa/implementation-vendor-operations.png` | `qa/comparison-vendor-operations.png` |

Source dimensions are 576 × 1280 px. The comparison plan preserves the existing proportional normalization to 852px reference height and 393 × 852 CSS-pixel implementation captures at device scale factor 1. Safe-area and device-chrome differences remain excluded from app-layout findings.

Source-based findings and verified changes:

1. The source distinguishes three menus that the earlier implementation did not provide separately. The dashboard now has nine text-only actions in an upper-left menu; purchases has five export/import choices; each selected supplier has a six-action contextual menu. The existing global purchases creation menu remains a separate state.
2. The source keeps the purchases filters visible while supplier cards scroll. The implementation now uses a fixed approximately 158px filter region with a list of 13 demonstration suppliers, approximately 70px cards and 10px gaps. Blue count badges and red IDs restore the source's card anatomy.
3. Supplier-context actions now seed invoice, return, quote, and order forms with the selected account, and currency exchange retains that account rather than reverting to the first supplier.
4. Compact account creation and account selection have more readable controls. The picker has an orange search label/underline and functional account filtering. Compact image/currency choices and checkboxes remain local selections.
5. Import/export actions show demonstration feedback only: no account file is read, no PDF/Excel file is created, and no external request is made by those actions. Form selections and mock accounts do not represent production accounting data.

Fourth-set rendered comparison history:

1. The first full interaction run passed all three selected tests in 52.4s. The production build passed and integrity verification confirmed all 28 protected runtime files unchanged.
2. All five initial comparison boards above were opened together with their source screenshots. Compact account and account-picker modal bounds, control order, blue outlines, orange search label, and bottom actions closely follow the supplied states. The dashboard menu has the intended nine text-only rows; the purchases menu has the intended five export/import rows; the contextual supplier menu has six rows.
3. [P2, resolved] In the first purchases-export board, supplier-card content painted beneath the fixed totals footer into the device's lower safe-area region. The purchases layout now owns an opaque background and the scrolling list reserves the footer area. The final regenerated export and supplier-menu boards confirm that no card content leaks below the footer; the interaction test also verifies the list's bottom boundary against the footer.
4. [P2, resolved] The first supplier-operations menu extended approximately 12px too low relative to the footer boundary. Its bottom offset was adjusted to 88px for the iPhone preview and 54px for Pixel 10. The final board shows the menu meeting the top of the totals area. The initial capture's prior-route strip and clipped title were motion artifacts; neither appears in the final stable comparison capture.
5. Dashboard account editing was completed as a selection flow: choose an account, then open its populated compact edit modal. This flow passed in the final affected-test rerun.
6. Across the first boards, the remaining visible differences are primarily NASQO font weight/icon style, mock account labels and counts, established dashboard content, and protected device chrome. No additional significant fourth-set mismatch was identified beyond the footer and menu-placement findings above.

Final verification:

- The production build passed after the footer, menu-position and edit-flow changes. Integrity verification confirms all 28 protected runtime files remain unchanged. The existing large-bundle advisory is a nonblocking performance follow-up.
- The final affected-test rerun passed **2 tests (27.9s)**. It covers the nine-item dashboard menu, compact-account choices, searchable account selection, populated account editing, five purchases export/import options, pinned filters during list scrolling, six supplier operations, and an invoice bound to the selected supplier. No external HTTP requests, file chooser, or browser errors were recorded in these flows.
- All five implementation captures and comparison boards were regenerated after the final changes. The final purchases-export and supplier-operation boards were opened and reviewed again to verify the resolved footer and menu findings.
- An additional in-app-browser check confirmed the nine-item dashboard menu on the currently selected iPhone preview. The preview tab remains open as the deliverable.

Final fidelity review for the fourth set:

| Surface | Assessment |
| --- | --- |
| Typography | Arabic labels are readable at the preview size. NASQO's existing font stack and weight intentionally differ from the reference's Android rendering; exact font metrics remain minor polish. |
| Layout and spacing | Compact account and picker modal bounds, menu row density, left-side menu anchors, fixed purchases filters and dense supplier cards follow the supplied states. Final cards and menus respect the totals footer boundary. |
| Colors | Blue outlines and toolbars, orange selected controls and search underline, and red/green amounts preserve the reference semantics. |
| Icons and assets | Crisp library icons and NASQO branding remain intentional substitutions for the reference's legacy clipart, logo and watermark. |
| Copy and behavior | All nine dashboard, five export/import and six supplier-menu labels are present. Picker search and supplier context work locally; mock names, balances and counts are demonstration content. |

Normalization: source screenshots are proportionally resized from 576 × 1280 to 852px height, beside 393 × 852 CSS-pixel implementation captures at device scale factor 1 in a 1400 × 1200 browser viewport. The full boards retain readable labels and controls, so no additional focused crops were needed. Protected device chrome is excluded from app-layout judgments.

No remaining actionable P0/P1/P2 finding in these five states. Remaining P3 differences concern font metrics and icon styling. This is a local interactive design prototype: saving accounts, importing/exporting files, sending messages, and live accounting integration are not implemented or claimed.

## Fifth two-state refinement

Exact user attachments (relative to the chat workspace):

| Reference state | Attachment |
| --- | --- |
| Dashboard, closed navigation | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/d4e237ba-154c-4bd0-9020-2d85de999d6e/1-1000549900.jpg` |
| Right navigation drawer | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/d4e237ba-154c-4bd0-9020-2d85de999d6e/2-1000549907.jpg` |

Rendered evidence:

| State | Implementation capture | Comparison board |
| --- | --- | --- |
| Dashboard | `qa/implementation-dashboard-v5.png` | `qa/comparison-dashboard-v5.png` |
| Navigation drawer | `qa/implementation-drawer-v5.png` | `qa/comparison-drawer-v5.png` |

Reference-derived geometry: sources are 576 × 1280px. At the established 852px proportional normalization, the app toolbar is approximately 49px tall, the three-row quick-action grid occupies 92px, the four two-column card rows have approximately 107px height and 10–11px gaps, and the bottom version/social bar is approximately 28px tall. Horizontal card margins are approximately 5% of screen width. For the drawer, preserve approximately 84.5% width, a hero approximately 168px tall, and 45px navigation rows. Absolute top coordinates must be adjusted for the protected iPhone/Pixel safe areas rather than copying the source's Android status-bar height.

Initial findings from the source screenshots and existing captures/code:

1. Dashboard categories differ materially: the required RTL rows are sales/purchases, clients/employees, transfers/shop, and measurements/new measurement. Existing inventory and cash tiles replace employees and shop, while added metadata and currency suffixes alter the card anatomy. The last row should present icons and labels without balance or metadata captions.
2. The reference uses green credit values for purchases/employees and red debit values for sales/clients/transfers/shop. The earlier dashboard uses neutral amount text and small green metadata. Match the semantic color treatment and compact signed-balance layout.
3. The toolbar should retain a one-line NASQO title and familiar action order, while the quick buttons use the reference labels including “حوالة جديدة”, “صناديق النقدية”, “فاتورة جديدة”, and “البحث السريع”. Retain NASQO identity and library icons rather than copying the source application's logo or clipart.
4. The 52px four-tab dashboard navigation differs from the reference's approximately 28px blue version/social bar. The floating orange add control should clear that bar, with its target diameter approximately 53px and right margin approximately 15px.
5. The drawer's first group must contain nine rows in order: language/appearance, notifications, SMS messages, WhatsApp messages, reports, quotations, orders, trash, and settings. No first-group heading appears in the reference. A divider and “المخازن” heading precede warehouses and inventory transfers. Existing business/account groupings and the pinned WAHA preview footer are not part of this reference state.
6. The drawer begins below the full-width app toolbar; the close arrow replaces the hamburger at the toolbar's right edge. Preserve the visible dimmed dashboard strip at left, approximately 15.5% of screen width. Retain an app-owned NASQO hero in place of the third-party brand image.

Implemented changes and verification:

1. The dashboard now has the reference's eight-card order and compact balance anatomy. Credit values are green, debit values red, and measurement cards have only an icon and label. All nine quick actions use the reference wording; the one-line NASQO toolbar is 50px tall above app content.
2. The dashboard footer is now a 28px version/link bar. NASQO's own version is shown, and links remain local preview controls. WhatsApp opens the existing settings screen. The orange add button is a fixed app overlay clear of the footer.
3. The drawer begins beneath the toolbar at 104px on iPhone and 106px on Pixel. Its 84.4% panel contains a 168px NASQO brand hero, the nine ordered 45px navigation rows, then the warehouse group. The whole panel scrolls through MobileScroll, with activation still reachable further below. It no longer presents a pinned WAHA status.
4. The initial in-app-browser review found the dashboard add button near the top because its safe-area variable was unavailable outside MobileScroll. Its bottom anchor now uses the device safe-area value and the Pixel viewport override. The corrected capture shows it above the footer, and a dedicated geometry assertion verifies it is below the cards and above the footer.
5. The primary flow, two fifth-set flows, and two third-set regression flows passed together: **5 tests passed (1.0m)**. The dashboard test was then rerun after adding the geometry assertion: **1 test passed (20.1s)**. New flows check card ordering, balance colors, footer clearance, drawer width/anchor, close behavior, scrolling and navigation to WhatsApp and warehouses. No browser errors or external requests were recorded in the new flows.
6. The final production build passed. Runtime integrity confirms all 28 protected files remain unchanged. The existing large-bundle advisory remains a nonblocking performance follow-up.
7. Both comparison boards were generated and opened. An additional in-app-browser review verified the updated dashboard and drawer, and the deliverable tab remains open on the drawer. The dashboard board was refreshed from the final geometry-test capture.

Final visual assessment:

| Surface | Assessment |
| --- | --- |
| Typography | Labels remain readable at the 393 × 852 preview size. The existing NASQO font weight and Arabic font metrics differ from the reference, without truncation. |
| Layout and density | Nine compact quick actions, four rows of two 107px cards, side margins, floating add control and version footer follow the reference anatomy. The drawer preserves its left dimmed strip, top anchor and row spacing. |
| Color | Blue header/outlines/footer, orange middle quick-action row and add button, red/green balances, and neutral drawer text preserve the reference semantics. |
| Icons and identity | NASQO's hero and crisp library icons intentionally replace the source logo, clipart and platform marks. The footer uses local NASQO destinations and the actual prototype version. |
| Controls and copy | Primary labels and drawer order match the selected references. Existing forms and routes remain reachable; unsupported destinations show explicit preview feedback. |

Normalization remains a proportional 576 × 1280 source scaled to 852px height beside a 393 × 852 CSS-pixel implementation capture at device scale factor 1 in a 1400 × 1200 browser viewport. Protected device status bars, navigation and camera areas explain the vertical offset and are excluded from app-layout findings. Full boards retain readable controls, so focused crops were unnecessary.

No remaining actionable P0/P1/P2 mismatch was found in these two states. Font metrics and library-icon style are P3 differences. These changes remain local prototype behavior; no production deployment, messaging, import/export or accounting write occurred.

## Sixth five-state refinement

Exact user attachments (relative to the chat workspace):

| Reference state | Attachment |
| --- | --- |
| Cash-purchases supplier statement | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/da6598e5-7720-4a3b-8c91-f3c799299e9f/1-1000549915.jpg` |
| Purchases list, menus closed | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/da6598e5-7720-4a3b-8c91-f3c799299e9f/2-1000549914.jpg` |
| Drawer, help/about continuation | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/da6598e5-7720-4a3b-8c91-f3c799299e9f/3-1000549910.jpg` |
| Drawer, cloud/photo backup continuation | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/da6598e5-7720-4a3b-8c91-f3c799299e9f/4-1000549909.jpg` |
| Drawer, warehouses/accounts/local backup continuation | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/da6598e5-7720-4a3b-8c91-f3c799299e9f/5-1000549908.jpg` |

Rendered evidence:

| State | Implementation capture | Comparison board |
| --- | --- | --- |
| Cash statement | `qa/implementation-cash-statement-v6.png` | `qa/comparison-cash-statement-v6.png` |
| Purchases list | `qa/implementation-purchases-v6.png` | `qa/comparison-purchases-v6.png` |
| Drawer accounts/backups | `qa/implementation-drawer-accounts-v6.png` | `qa/comparison-drawer-accounts-v6.png` |
| Drawer cloud/photos | `qa/implementation-drawer-cloud-v6.png` | `qa/comparison-drawer-cloud-v6.png` |
| Drawer help/about | `qa/implementation-drawer-about-v6.png` | `qa/comparison-drawer-about-v6.png` |

Reference-based findings and targets:

1. The cash supplier statement is a separate visual state from the existing credit statement. Its header reads “مشتريات نقد هلال”; cash type labels, amounts and dates are blue, all visible running balances are zero, and transaction IDs are red. The six visible representative amounts are 20,000, 3,000, 17,000, 4,900, 1,500 and 1,000. Row details span one or more lines. Demonstration period totals are 1,168,310 on both sides with zero balance; these are full-period figures rather than the sum of only the six visible rows.
2. At the established 852px proportional normalization, the cash filters occupy approximately 110px beneath the toolbar, the table heading approximately 27px, and transaction rows approximately 85–103px depending on detail length. Edit, PDF and share controls sit at the bottom left of each row, while the date sits at the bottom right. Preserve the approximately 53px orange add button and blue totals bar, with content clearing fixed footer chrome.
3. The repeated purchases reference verifies the closed-menu state: fixed filters, blue date range, approximately 70px supplier cards and 10px gaps, count badges, red IDs, right-side call control, red/green balances, orange add button and totals footer. Existing mock supplier names, phones and figures remain intentional demonstration content.
4. The first continued drawer view begins with the last primary settings row. The warehouse group contains warehouses, stock transfers, items and item import from Excel. The accounts group contains chart of accounts, currencies and account import. The backup group contains phone backup, Telegram backup, backup sharing and restore.
5. The cloud group contains Google Drive, Google Drive settings and restore from Drive. The attached-photo group contains copying the photo folder to Drive, sharing that folder, photo backup restore and photo restore from Drive. The “أخرى” group contains error handling, app activation and suggestions.
6. The final “عن التطبيق” group contains the YouTube explanation, terms of service, privacy policy, contact, application update, application sharing, about and rating actions. Its final rating row remains reachable; the header and visible dimmed dashboard strip stay fixed while drawer content scrolls.
7. Retain the drawer's approximately 84.4% width, approximately 45px item rows, approximately 46px group headings and thin gray group dividers. Capture accounts, cloud and about states at separate scroll offsets while preserving continuous content rather than swapping drawer pages. Absolute screen coordinates adjust for the protected iPhone/Pixel safe areas.

All new backup, restore, cloud, photo-sharing, import, update and contact controls are local prototype affordances. They must not create external requests, read or write user files, link accounts, upload media, restore data or send messages. Existing supported local routes may open their corresponding screens; otherwise show explicit preview feedback. NASQO branding, library icons, live device time and protected chrome remain documented differences from the source.

Implemented changes and verification:

1. The second demonstration supplier now opens a dedicated cash statement through its card, transaction-count button or account picker. The existing credit statement remains separate. Six cash rows have blue types, amounts and dates, red IDs and zero running balances; period/currency/previous-balance controls work locally. Edit/add actions retain the selected supplier, while PDF/share actions remain explicit demonstrations.
2. All continued drawer groups were added to the same scroll surface: warehouses/items, accounts, local backups, Drive, attached photos, other actions, and application information. Existing supported destinations open local screens, and backup/import/update/contact controls show preview feedback. Activation remains reachable under “أخرى”.
3. Purchase-card IDs and transaction counts now stay attached to the supplier after sorting, and the cash supplier's demonstration phone is visible. The repeated purchases state preserves fixed filters, dense cards and its distinct menus.
4. [P2, resolved] The first cash comparison showed the sixth row's actions beneath the footer on the smaller iPhone preview. Default row heights were tightened to 80/95px; Pixel retains 85/103px. Final captures and geometry assertions show all six action groups above the totals footer.
5. [P2, resolved] The repeated purchases comparison exposed an existing floating-add button overlap with the totals bar. It now uses a 53px diameter and clears the footer plus device safe area by 15px. Its opening/closing behavior and footer clearance are verified.
6. A subsequent test capture exposed hidden lower-screen content after interacting with an incoming route before its transition had settled. The final test waits for actual route alignment, checks keyboard-hidden state and header/layout bounds, and does not dismiss the keyboard to hide a failure. The clean final capture shows the complete header and no displaced dashboard strip. Purchase-menu toggling also explicitly dismisses the keyboard, following the app interaction contract; protected runtime files were not changed.
7. The three prior primary/menu regression flows passed. The final new drawer and cash flows passed together: **2 tests passed (36.2s)**. After adding purchases-button and resting-layout checks, the affected cash/purchases flow passed again: **1 test passed (24.4s)**. Checks cover drawer order and reachability, stable supplier metadata after sorting, cash/credit separation, all-zero cash balances, period/currency/previous-balance selection, fixed filters, last-row actions and FAB/footer clearance. No browser errors, external requests, downloads or file chooser actions were recorded in the new flows.
8. The final production build passed, and all 28 protected runtime files remain unchanged. The existing large-bundle advisory is a nonblocking performance follow-up.
9. All five comparison boards were generated and reviewed. The three continued drawer states have readable labels through the final rating row; the cash and purchases boards were regenerated after their final affected test. An additional in-app-browser check verified the cash statement on the user's selected Pixel 10 preview; that tab remains open as the deliverable.

Final visual assessment:

| Surface | Assessment |
| --- | --- |
| Typography | Arabic labels and multiline cash details are readable without truncation. Existing NASQO font metrics and weight intentionally differ from the reference. |
| Layout and density | Cash filter/table structure, six transaction rows, fixed totals, supplier cards and floating controls preserve the reference anatomy. Continued drawer group spacing and order match the supplied scroll states. |
| Colors | Cash amounts/types/dates stay blue, IDs red and balances blue zero; purchases retains red/green balances. Blue bars, orange selections and neutral drawer dividers are consistent. |
| Icons and branding | NASQO identity and library icons remain intentional substitutes for legacy clipart, logos and platform marks. |
| Copy and controls | Reference menu labels and representative cash details are present. Mock account data and full-period totals remain demonstration content; backup, sharing and cloud actions do not perform real operations. |

Normalization: the 576 × 1280 references are proportionally resized to 852px height beside 393 × 852 CSS-pixel captures at device scale factor 1 in a 1400 × 1200 browser viewport. Protected phone status/camera/navigation areas explain absolute vertical offsets and are excluded from app-layout judgments. Full boards make text and controls readable; no additional focused crops were required.

No remaining actionable P0/P1/P2 visual finding in these five states. Remaining P3 differences concern font metrics, library icons and documented demonstration data. Changes remain local; no production deployment, backup restoration, cloud upload, message or accounting write occurred.

## Seventh five-state refinement

The new selection contains five states. Three subsequent attachments are clearer duplicates of the cash operations menu, purchases export menu and simple-entry form; they are the comparison sources for those same states.

Exact user attachments (relative to the chat workspace):

| Reference state | Attachment |
| --- | --- |
| Drawer, local/cloud/photo backup continuation | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/aa39fa74-2b78-408a-83b0-fd8cf601c3a6/1-1000561811.jpg` |
| Drawer, help/about continuation | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/aa39fa74-2b78-408a-83b0-fd8cf601c3a6/2-1000561810.jpg` |
| Cash statement, scrolled with operations menu | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/4296cd8c-9c9e-4286-9a04-9943ba8af554/1-1000561805.jpg` |
| Purchases, five-item export menu | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/4296cd8c-9c9e-4286-9a04-9943ba8af554/2-1000561806.jpg` |
| Full-screen simple entry | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/4296cd8c-9c9e-4286-9a04-9943ba8af554/3-1000561804.jpg` |

The original versions of the last three states are respectively `aa39fa74-2b78-408a-83b0-fd8cf601c3a6/3-1000561805.jpg`, `aa39fa74-2b78-408a-83b0-fd8cf601c3a6/5-1000561806.jpg` and `aa39fa74-2b78-408a-83b0-fd8cf601c3a6/4-1000561804.jpg` under the same attachment parent. Their state and requested behavior are unchanged.

Rendered evidence:

| State | Implementation capture | Comparison board |
| --- | --- | --- |
| Simple entry | `qa/implementation-simple-entry-v7.png` | `qa/comparison-simple-entry-v7.png` |
| Cash operations menu | `qa/implementation-cash-menu-v7.png` | `qa/comparison-cash-menu-v7.png` |
| Purchases export menu | `qa/implementation-purchases-export-v7.png` | `qa/comparison-purchases-export-v7.png` |
| Drawer backups | `qa/implementation-drawer-backup-v7.png` | `qa/comparison-drawer-backup-v7.png` |
| Drawer help/about | `qa/implementation-drawer-about-v7.png` | `qa/comparison-drawer-about-v7.png` |

Reference-derived findings and targets:

1. The simple-entry form is a full-screen route, titled “قيد بسيط”, with the existing blue toolbar and a compact right-aligned time/date tag immediately below it. Separate from/to account search and dropdown controls precede two full-width orange balance strips. A small blue swap control is beside the destination search. The form ends with amount/currency, description, document number and separated save/cancel actions; the area below is white space.
2. In the 576 × 1280 source, the first account dropdown spans x29–548 and y253–307; its balance strip spans x14–562 and y311–343. The second dropdown spans y445–499, followed by its balance strip at y503–536. The amount underline is around y593, description underline y668, document underline y735, and the action buttons span y790–857. At proportional 852px normalization, dropdowns are approximately 36px high, balance strips 22px, and actions 45px. Apply the protected device safe-area offset to absolute positions rather than copying the source Android status bar. Preserve the orange focused amount treatment and live form time.
3. Cash menu geometry is approximately x7–282 and y750–1152 in the source: 48% screen width with six roughly 67px source rows, or 45px normalized rows. It is a white, text-only lower-left overlay with a soft shadow, no dim backdrop, and its lower edge immediately above the blue totals footer. Ordered labels are “فاتورة جديدة”, “مردود جديد”, “حوالة جديدة”, “صرف عملات”, “عرض سعر” and “طلبية جديدة”. The fixed filters and table heading remain visible while ledger rows scroll underneath.
4. The scrolled cash ledger begins with the clipped controls/date of transaction 607, then shows 588 (8,000), 508 (19,000), 471 (3,000), followed by 40,000, 12,500 and 4,500 rows. Representative details include “كيب ستور”, “سخان فوري”, “مكينة خياطة كبير”, “دفاية سمكة” and “طربال سيارة”. Blue cash amounts/type/date, red transaction IDs and zero running balances remain distinct from the credit statement. Earlier cash rows are retained, and period totals remain demonstration full-period values.
5. The purchases reference repeats the five-row upper-left export/import menu, approximately 58% screen width. Retain PDF print/share, Excel export/share and account import, fixed filters, dense supplier cards, distinct contextual supplier controls, and orange floating-add clearance above the totals footer. It is an existing state to verify, not a new export workflow.
6. The backup drawer capture begins at phone backup, continues through Telegram backup, share and restore, then Drive and attached-photo groups. The repeated about capture begins around photo-folder sharing and continues through “أخرى” and all application-information actions. Preserve one continuous scroll surface, approximately 84.4% drawer width, 45px item rows and 46px group headings. The full-width toolbar and dimmed left dashboard strip remain fixed.

All state is local to the prototype. Account data, balances and dates are demonstration or live-device content rather than copied customer records; NASQO branding, library icons and protected device chrome remain intentional differences. Simple-entry save, exports, backup/restore, cloud, sharing and message controls must not perform real accounting writes, file operations or external requests.

Implemented changes and verification:

1. The dashboard's “قيد بسيط” action opens the new full-screen form. Source and destination searches filter the demonstration account list independently; selection, clearing and swapping work locally. The form includes currency, amount, description, document number and live time. Validation rejects missing accounts, identical accounts and nonpositive amounts. Successful submission displays an explicit preview-only message, leaves balances unchanged and creates no ledger record.
2. The cash statement now contains 13 demonstration rows: the original six remain at the top, followed by the older rows needed for the scrolled reference. The partially visible transaction 607 uses an unknown amount marker rather than inventing the obscured source amount. The menu has all six requested actions, retains the selected supplier and sits immediately above the fixed totals footer. Cash invoice defaults are purchase/cash. The footer transfer control opens the simple-entry form with the cash account selected.
3. [P2, resolved] The initial swap symbol resembled an on/off switch. Simple-entry swap and cash-footer transfer now use opposing arrows. Cash-toolbar controls were reordered to match the reference. Both final comparison boards were regenerated after these corrections.
4. [P2, resolved] Behavioral checks found that leaving a simple-entry text field did not dismiss the simulated keyboard. A form-scoped blur handler now dismisses it when focus leaves the text fields, while preserving keyboard continuity when moving directly between text fields. No protected runtime code was changed.
5. The combined primary, sixth and seventh checks comprise six tests. Four unchanged flows passed in the first run; the two affected cash/form flows passed in the final rerun (**2 passed, 44.1s**). The tests verify cash supplier context across six destinations, purchase/cash defaults, fixed filters/header/footer, entry search/select/swap/clear, missing/equal accounts, invalid amount, preview-only save, fresh defaults on reopening, text-to-text keyboard continuity, and dismissal on select/header focus. The new tests recorded zero browser errors, external requests, write requests, file choosers, downloads or popups.
6. Test synchronization waits for one settled current route and actual header/content alignment before interacting. This prevents capturing an outgoing/incoming route transition as an app layout defect. Keyboard dismissal is tested by normal focus changes, not by unsupported Escape behavior.
7. The final production build passed, including the integrity check for all 28 protected runtime files. The existing large-bundle advisory remains a nonblocking performance follow-up. An in-app-browser check verified the new form and account swapping on the selected Pixel 10 preview; the preview tab remains available.
8. All five implementation captures and comparison boards were generated and inspected. The drawer states preserve ordered groups, continuous content, the fixed toolbar and dimmed dashboard strip through the final rating row. Purchases export preserves all five labels and its upper-left position. The cash menu has the correct lower-left position and six text-only rows without dimming. Simple entry preserves field order, paired account/balance groups, whitespace and separated bottom actions.

Final visual assessment:

| Surface | Assessment |
| --- | --- |
| Layout | The form, fixed cash filters, scrolled history, menu anchors and continued drawer states follow the supplied references. Protected iPhone status/chrome explains the principal vertical offset; the remaining small form spacing difference is cosmetic. |
| Color and hierarchy | Blue bars/outlines, orange balance strips and selected input treatment, blue cash values, red transaction IDs and neutral menu surfaces preserve the source hierarchy. |
| Text and controls | Arabic labels remain readable, the six cash actions and five export actions are distinct, and the new form's local interactions are verified. |
| Intentional differences | NASQO branding, library icons, Arabic font metrics, live time, demonstration account data and protected phone chrome remain. Voice controls use the existing speaker-style library symbol; this is a documented P3 visual difference. |

Normalization remains proportional: 576 × 1280 references resized to 852px height beside 393 × 852 CSS-pixel captures, device scale factor 1, browser viewport 1400 × 1200. Full boards expose all relevant controls; no extra focused crops were needed. No remaining actionable P0/P1/P2 finding was identified in these five states. No production deployment, accounting write, message, backup restoration, upload or export took place. Earlier assessments above remain historical records.

## Eighth three-state refinement

The latest four attachments represent three distinct states. The last two images show the same cash-purchase invoice and are treated as one document reference, not two different invoices.

Exact user attachments (relative to the chat workspace):

| Reference state | Attachment |
| --- | --- |
| Cash statement, currency dropdown | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/7a1b6e5c-806b-4a1b-9fdb-22e3d4774fd5/1-1000561803.jpg` |
| Cash statement, search criteria menu | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/7a1b6e5c-806b-4a1b-9fdb-22e3d4774fd5/2-1000561802.jpg` |
| Cash-purchase invoice 1140 | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/7a1b6e5c-806b-4a1b-9fdb-22e3d4774fd5/3-1000561800.jpg` |
| Duplicate invoice reference | `.codex-remote-attachments/01a1dac5-87b7-7323-a608-2a35ca8b041f/7a1b6e5c-806b-4a1b-9fdb-22e3d4774fd5/4-1000561801.jpg` |

Evidence plan (verification pending):

| State | Implementation capture | Comparison board |
| --- | --- | --- |
| Cash currency menu | `qa/implementation-cash-currency-v8.png` | `qa/comparison-cash-currency-v8.png` |
| Cash search menu | `qa/implementation-cash-search-v8.png` | `qa/comparison-cash-search-v8.png` |
| Landscape invoice | `qa/implementation-cash-invoice-v8.png` | `qa/comparison-cash-invoice-v8.png` |

Reference-derived findings and targets:

1. In the 576 × 1280 currency source, the white popup spans approximately x23–515 and y128–327: about 85.4% of screen width, with five centered gray text rows of approximately 40px source height (27px at the established 852px normalization). It overlays the currency field, period options and part of the date/header area without dimming the statement. Ordered labels are “ريال”, “عملة 2”, “دولار”, “جميع العملات بدون مصارفة” and “مصارفة الكل بعملة ريال”.
2. The currency background begins with the clipped action/date row of transaction 471, followed by 431 (40,000, 25/11/2025), 390 (12,500, 23/11/2025), 375 (4,500, 23/11/2025), 362 (40,000, 22/11/2025), 341 (43,000, 22/11/2025) and the upper portion of a 3,500 row. These newly visible IDs clarify values previously obscured by the seventh menu. They supersede the earlier illustrative IDs for those rows; the earlier six-row baseline remains unchanged.
3. Representative newly visible details are: “طربال سيارة مقاس مترين | 2 حبة”; the three-line “حزام ركبة الاصفر | 5 حبة / مساج الاقدام اسود | 5 حبة / مساج رقبة | 1 حبة”; “حقيبة خصر ملون | 5 حبة”; “مساج رقبة | 5 حبة”; and “منشار جلخ طاولة | 2 حبة”. The partially visible 3,500 row reads “ام بي ثري ديسكو اسود | 1 حبة”; its ID and date are obscured and should not be presented as verified source data.
4. The search popup spans approximately x0–275 and y45–649: 47.7% of source width, nine text-only rows about 67px source height (45px normalized), a soft shadow and no dim backdrop. It starts under the protected status region and covers the left toolbar/filter/ledger area. Ordered criteria are all, number, description, document number, sender name, recipient name, company name, amount owed and amount credited. Preserve the Arabic “البحث بواسطة …” wording; normalize the apparent missing-letter typo in the source's final amount label to “المبلغ له”. Selecting a criterion should lead to a local query surface with visible filtering, an empty-result state and a reset path.
5. The search background is a long multiline transaction numbered 16, dated 7/11/2025, with its edit/PDF/share controls close to the fixed footer. Representative lines include thermal printer paper, an angle-grinder adapter, thermal bags, a car exhaust whistle, a humidifier, insulin cooler, toy airplane, pull-up car curtain, fruit juicer, tyre inflator, Toyota door stickers, a butterfly massager and upholstery cleaner. Keep a tall local example so the search overlay can be compared at the supplied scroll position; no complete customer ledger is implied.
6. Both invoice files are 1280 × 908 landscape images. The bilingual business blocks occupy the top corners, a centered bordered cash-purchase title spans approximately x478–802 and y131–180, and the narrow bordered application banner spans x70–1209 and y180–220. The transaction date/number line is around y248, recipient line around y316, and blank description label around y383. Preserve NASQO's own preview wording rather than copying the other application's brand claim.
7. The invoice table spans x48–1231 and y411–582. From right to left its columns are item, unit, quantity, price and total, with approximate widths 538, 151, 129, 172 and 194px. The header is about 69px high and each of the two body rows about 51px. The two example items are “توصيلة تايب سي 2 متر” and “بطارية جهاز كشف الذهب”, each with unit “حبة”, quantity 1 and price/total 1,500. Quantities, number 1140 and amount words are red; line totals and grand total 3,000 are blue. The summary shows quantity 2 and the words “ثلاثة ألف ريال”. Its bordered words box spans approximately y637–688. Page 1 and the generated timestamp sit low on the otherwise blank page around y826.
8. Capture the phone menu states at the established 393 × 852 CSS-pixel size, adjusting only for protected device chrome. Capture the invoice document itself at landscape size for comparison, separately from its mobile zoom/navigation wrapper. It must remain rendered text/table content, not an image background; a legible zoom state and return path are needed for the phone preview.

Interim visual review: the currency and search comparison boards have been opened and independently inspected. The currency overlay preserves its five centered options, gray text, width, anchor and nondimming surface, with the clipped 471 row and corrected older transaction details visible below. The search overlay preserves all nine labels in order, its upper-left anchor, approximately 48% width and readable 45px rows; the long transaction 16 and fixed totals remain visible. No actionable P0/P1/P2 visual mismatch was found in these two boards. The protected device safe area explains the principal vertical offset; NASQO font metrics, library icons and small text spacing remain documented P3 differences. The final landscape invoice capture is still awaiting review after its clipping and typography refinement.

The new controls remain local demonstrations. No currency conversion should silently imply live exchange rates; no menu, search or invoice action may make a real accounting write, external request, print job, download, upload, file picker or share. Earlier assessments above remain historical records. Overall verification remains pending until the final invoice comparison, local interactions, protected-runtime check and final build have been reviewed.

## Final result

pending — eighth-set currency/search menus and landscape invoice implementation are being verified. The seventh-set result above remains passed as a historical assessment.
