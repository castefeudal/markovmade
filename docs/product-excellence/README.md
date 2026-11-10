# Product Excellence / Precision LAB

Base for before screenshots: `3f00e9d1fbe7ee3f182ae45b5b1c91aabc4bc45a`.

## Product changes

- Hero explains training and nutrition, with immediate Telegram contact and a separate free-calculation path. Mobile presents both actions before the original portrait. Contact follows the core product/method flow; biography and community are secondary.
- Three native service disclosures describe personal analysis, training/nutrition and comprehensive support without invented prices, durations or guarantees. Telegram and WhatsApp are available without a questionnaire; the optional form exists once.
- LAB starts with four task groups. All nine existing tab identities, history and specialized tools remain available through the optional catalog and related shortcuts. QUICK remains the first view; PRO and calibration require an explicit choice.
- Nutrition, body composition, progress, recovery and overfeeding receive versioned corrections. See [scientific methods, populations, limitations and fixtures](scientific-methods.md).
- Meal arithmetic uses the user's label energy and nutrients. It supports comma decimals, reference portions, ingredient masses, recipe portions, local products/recipes, copying, and explicit diary transfer. Missing diary entries are not treated as observed zero intake.
- Personal OS Today shows a goal, one next action, two relevant measures and a review point. Empty state has one starting instruction. Tasks persist behind a disclosure. Actual journal data require explicit consent; demo examples remain labelled.
- Product analytics use one local allowlisted event path, with tool/action identifiers only. Free text, URLs, measurements and message contents are excluded; no events are forwarded to third-party trackers.

## Data compatibility

Existing LAB, history, daily entries, favorites and OS keys are retained. Stored model versions and results are not recalculated when reading history. The new `markovmade-meals-v1` store has its own schema `1`; it does not migrate or overwrite previous product data. Meal data are an optional validated field of the existing atomic backup. Backups without meals retain the current meal store. Explicit clear-all includes meal data.

Meal transfer first asks for confirmation and then fills the existing diary form. Saving the day remains explicit. It preserves existing logged intake and does not create a second diary.

## Browser screenshots

`scripts/product-evidence.cjs before` serves the actual baseline HTML and generated assets from the base commit; `after` serves the current build. Both capture Chromium, original media, reduced motion and identical desktop/mobile widths. Evidence capture forces offscreen content to render to prevent content-visibility placeholders from shifting the screenshot; it does not replace the page with a concept render.

| Screen | Before mobile | After mobile | Before desktop | After desktop |
| --- | --- | --- | --- | --- |
| Hero | [390](before/hero-390.png) | [390](after/hero-390.png) | [1440](before/hero-1440.png) | [1440](after/hero-1440.png) |
| LAB | [390](before/calculators-390.png) | [390](after/calculators-390.png) | [1440](before/calculators-1440.png) | [1440](after/calculators-1440.png) |
| Personal OS | [390](before/app-ecosystem-390.png) | [390](after/app-ecosystem-390.png) | [1440](before/app-ecosystem-1440.png) | [1440](after/app-ecosystem-1440.png) |
| Services | [390](before/services-390.png) | [390](after/services-390.png) | [1440](before/services-1440.png) | [1440](after/services-1440.png) |
| Contact | [390](before/contact-390.png) | [390](after/contact-390.png) | [1440](before/contact-1440.png) | [1440](after/contact-1440.png) |

## Test contract changes

The previous authored-copy and visual-only source seals described a presentation-only task. This request explicitly changes copy, numerical behavior, storage integration and analytics. Intentional functional files are frozen at exact new checksums in `tests/product-excellence-scope.json`; untouched sources retain their previous contracts. Authored text seals are updated only for explicitly redesigned components and dictionaries. Numerical legacy fixtures, visual mismatch tolerances, accessibility rules, the 900 px input-reach limit, CLS < 0.01 and Lighthouse Performance >= 95 are retained.

Visual candidates must be reviewed before replacing references, followed by a normal run without refresh flags. Windows and Linux references remain separate. Capture-mode success messages do not constitute a green visual check.

## Limits

Energy expenditure, body composition and future weight are estimates or conditional scenarios, not individual measurements. Calibrations need adequate dated observations and cannot identify unrecorded activity or fluid shifts. Recovery rules are transparent monitoring heuristics, not medical readiness scores. Meal energy can differ from macro-derived energy because labels include rounding, fiber and other factors; the tool preserves label energy.

No client case, price, guarantee or credential was invented. No production release is implied by a branch or pull request. Production smoke must be performed against the published commit after publication. Laboratory Lighthouse results do not establish field Core Web Vitals; automated accessibility results do not replace manual review of the reported undecided items.

Final command outcomes and remaining release blockers are recorded in [verification](verification.md).
