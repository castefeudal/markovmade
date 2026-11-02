# Visual Excellence — review record

Visual work starts at main `75f54e8bcb51ba3f471919740d73093ebdb78887`. The photographs, fonts and authored copy remain authentic. All JavaScript sources, calculator domains and locale files are sealed by `tests/visual-scope.test.cjs`; the recorded SHA-256 values compare normalised source bytes.

## Three visual passes

1. **Systemic redesign:** separated twelve semantic typography roles; removed unlayered composition precedence and blanket Clarity surface resets; introduced ceramic relief, metallic planes and a cool technical field as original SVG assets. Numeric results use tabular Manrope. LAB headers use intrinsic height instead of a 180px floor.
2. **Component perfection:** inspected actual 390px Aurum, 768px Clarity and 1440px Horizon screenshots. Removed competing LAB intro declarations, aligned header/hero container axes and brought Personal OS immediately after its introduction on tablet/mobile. Supporting benefits follow the interface; desktop retains a story/interface composition.
3. **Optical mastering:** refined input/label rhythm, table/report alignment, grouped session sets and primary result scale. Real checks exposed and fixed an 8px session-button overflow, decimal wrapping, low contrast in contact format labels and a late-font layout shift at 2560px. The hero display scale now has a stable 96px ceiling and a fixed reading measure.

## Reproduce the evidence

- `ART_PASS=before VISUAL_REFERENCE_ROOT=<75f54e8 checkout> node tests/visual-excellence.capture.cjs` captures the before set.
- `ART_PASS=final node tests/visual-excellence.capture.cjs` captures the representative final set.
- `ART_PASS=pass-3 ART_FULL=1 node tests/visual-excellence.capture.cjs` captures RU/EN × three themes × 390/768/1440, the twelve section compositions, nine LAB directions in empty/PRO states and five OS panels.
- `node tests/visual-excellence-states.capture.cjs` captures calculated results for six primary models and all available toolkit instruments, session editor, error, history and share preview at 390/768/1440; also checks the eleven requested widths from 320 to 2560. Detail crops suppress fixed navigation/progress overlays only during the crop so they cannot obscure the component.
- `node tests/visual-excellence-montage.cjs` produces review contact sheets plus a filename manifest. These are review aids; the original PNG files remain in `test-results/visual-excellence`.

The product contract matrix additionally includes 428 and 600px, plus the existing widths. Firefox keyboard checks settle the responsive image and resize event before opening the menu. Assertions and screenshot mismatch thresholds remain unchanged.

## Before / after

| Composition | Before | After |
| --- | --- | --- |
| Horizon hero, EN / 1440 | [Before](visual-excellence/en-event-horizon-1440-hero-before.png) | [After](visual-excellence/en-event-horizon-1440-hero-after.png) |
| Aurum LAB, RU / 390 | [Before](visual-excellence/ru-aurum-noir-390-calculators-before.png) | [After](visual-excellence/ru-aurum-noir-390-calculators-after.png) |
| Clarity LAB, RU / 768 | [Before](visual-excellence/ru-clarity-768-calculators-before.png) | [After](visual-excellence/ru-clarity-768-calculators-after.png) |
| Clarity Personal OS, RU / 768 | [Before](visual-excellence/ru-clarity-768-app-ecosystem-before.png) | [After](visual-excellence/ru-clarity-768-app-ecosystem-after.png) |
| Horizon services, EN / 1440 | [Before](visual-excellence/en-event-horizon-1440-services-before.png) | [After](visual-excellence/en-event-horizon-1440-services-after.png) |
| Aurum biography, RU / 390 | [Before](visual-excellence/ru-aurum-noir-390-biography-before.png) | [After](visual-excellence/ru-aurum-noir-390-biography-after.png) |
| Clarity contact, RU / 768 | [Before](visual-excellence/ru-clarity-768-contact-before.png) | [After](visual-excellence/ru-clarity-768-contact-after.png) |

## Validation boundaries

The unchanged numerical, persistence, migration, import/export and interaction tests are required alongside browser, accessibility, visual, streaming-paint and Lighthouse gates. Automated axe checks report undecidable contrast over complex surfaces separately; a rendered-pixel audit supplements them. This is laboratory evidence, not a claim of manual assistive-technology certification or field Core Web Vitals.

Windows baseline candidates were captured and visually inspected before copying their intentional redesigns. Linux candidates require a separate review before the final non-refresh Quality run. The performance and visual thresholds are not reduced.
