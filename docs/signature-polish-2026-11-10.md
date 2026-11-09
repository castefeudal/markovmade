# Signature Polish 2.0

Base: `9274897e36dd74c9f15425fcd63968c615b26dd4`, the merged Signature PR #19.
Branch: `codex/signature-polish-2-2026-11-10`.
PR: https://github.com/castefeudal/markovmade/pull/20

## Delivered behavior

| World | Art direction and component geometry |
| --- | --- |
| Aurum Noir, default | Existing black/gold identity, photography and motion. Shorter mobile portrait bay makes the first action reachable sooner; stronger form boundaries. |
| Event Horizon | Chromatic titanium: deep blue-black, neutral metal surfaces and restrained cyan. Manrope display typography, framed portrait bay, precise small corners, instrument tabs and a two-column OS decision/metric layout. |
| Clarity | Editorial Atelier: warm paper, graphite and terracotta. Cormorant display typography, gallery portrait mount, square paper forms, editorial rules, flat service/contact surfaces and serif result numerals. |

LAB starts with a compact four-step introduction. Long explanatory text is still
available in disclosures. Local-data information remains visible; its complete
explanation expands in place. The existing clear-all button, confirmation and
handler now belong to data management. Mobile tabs use a horizontal tool rail;
wide input methods retain enough width. All nine directions and model text remain.

The empty Personal OS presents one primary LAB action and compact missing-data
rows. Calculating real results restores the detailed dashboard. Consent, demo
labels, five tabs, models, diary and storage are retained. The new empty-state
attribute is presentation only; source-hash guards still protect model code.

Contact uses two cards plus a full-width third card on tablets and one column on
phones. The floating utilities disappear below 1440 px and while a menu/dialog is
open. Header hit areas and the existing magnetic motion system are retained.

Theme Studio retains preview/save/cancel/Escape/focus and saved-settings behavior.
Its six language-specific previews combine actual final Hero and LAB screenshots,
480×480 WebP, requested only when the dialog opens. The 404 page shares the new
early palette; deterministic LF output avoids Windows/Linux hash differences.

## Real before/after evidence

Each sheet has **before on the left, after on the right**. Rows, from top to bottom:
**Aurum Noir, Event Horizon, Clarity**. Before is rendered from the fixed main
revision above, including its compiled CSS/runtime. No screenshots are mockups.

| Screen | Desktop 1440 px | Mobile 390 px |
| --- | --- | --- |
| Hero | [Color](polish-evidence/hero-1440.webp), [grayscale](polish-evidence/hero-1440-gray.webp) | [Color](polish-evidence/hero-390.webp), [grayscale](polish-evidence/hero-390-gray.webp) |
| Header | [Compare](polish-evidence/header-1440.webp) | [Compare](polish-evidence/header-390.webp) |
| LAB | [Color](polish-evidence/lab-1440.webp), [grayscale](polish-evidence/lab-1440-gray.webp) | [Color](polish-evidence/lab-390.webp), [grayscale](polish-evidence/lab-390-gray.webp) |
| Personal OS, empty | [Color](polish-evidence/os-1440.webp), [grayscale](polish-evidence/os-1440-gray.webp) | [Color](polish-evidence/os-390.webp), [grayscale](polish-evidence/os-390-gray.webp) |
| Personal OS, real calculation | [Compare](polish-evidence/os-filled-1440.webp) | [Compare](polish-evidence/os-filled-390.webp) |
| Services, closed | [Compare](polish-evidence/services-1440.webp) | [Compare](polish-evidence/services-390.webp) |
| Services, open | [Compare](polish-evidence/service-open-1440.webp) | [Compare](polish-evidence/service-open-390.webp) |
| Contact | [Compare](polish-evidence/contact-1440.webp) | [Compare](polish-evidence/contact-390.webp) |
| Theme Studio | [Compare](polish-evidence/studio-1440.webp) | [Compare](polish-evidence/studio-390.webp) |

Reproduce raw RU/EN screenshots with `node tests/polish-review.cjs`; refresh only
current renders with `POLISH_STAGE=after`. Compose these sheets and six real
Theme Studio previews with `node scripts/polish-evidence.cjs` (requires FFmpeg).
Raw 216 captures stay in ignored `test-results/polish`.

## Validation

- Clean `npm ci`, production build and 48 unit/source checks passed.
- `node tests/polish-browser.cjs`: Chromium, Firefox and WebKit × RU/EN × three
  worlds × 11 CSS widths passed at normal text size. The same matrix now also
  checks text-only enlargement to 200%. Includes mobile LAB entry, no page overflow,
  Contact 2+1 composition, safe utilities, empty/real OS and AA input boundaries.
  Windows WebKit's display scaling is compensated to test actual CSS widths.
- The complete local accessibility run passed RU/EN × three themes, four widths,
  nine LAB tabs, five OS tabs and dialogs. Axe's unresolved gradient/background
  contrast checks remain recorded separately; this is not a manual WCAG certificate.
- All 24 streamed first-paint/delayed-font samples passed. Largest local CLS:
  `0.00125`, against the unchanged `<0.01` contract.
- Pixel contrast measured 478 Aurum and 455 Horizon mobile text runs with no AA
  failures. It identified a 4.42:1 small Contact hint in Clarity; that hint now uses
  the darker terracotta ink. Recheck it with `node scripts/contrast-audit.cjs clarity 390 844`.
- Windows and Linux visual references were reviewed from actual candidates,
  including the final bilingual previews. Font contracts explicitly require
  Manrope for Horizon and the appropriate Cormorant locale face for Aurum/Clarity.
- The full E2E, accessibility, visual, paint and 36-sample Lighthouse release suite
  is enforced by [Quality CI](https://github.com/castefeudal/markovmade/actions/workflows/quality.yml).
  The PR records the final run. Pixel/performance thresholds are unchanged;
  mobile median Performance still must be at least 95.

## Limits

Automated browser checks are not physical-device or manual screen-reader testing.
No field CWV/INP evidence is available. Production verification applies only after
this revision is merged and published; PR #19's production is not evidence for
this branch. No dependencies, frameworks, model formulas or storage migrations
were introduced.
