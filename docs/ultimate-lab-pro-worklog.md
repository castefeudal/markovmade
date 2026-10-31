# Ultimate premium / LAB PRO — execution evidence

Base main: `0a3b6da`; integrated working branch / draft PR #13: `8a8b13a`.

## P0
- CI Lighthouse consistently fails Aurum mobile (91–93) while local full matrix yields 99–100. CI JSON attributes a 383 ms task to navigation.js, dominated by native "Other" work, not script evaluation. Investigating startup intersection registration and zero-position scroll; thresholds stay unchanged. Root cause is not yet claimed resolved.
- PR #13 has source-only PRO models and no matching build. Its caffeine-at-zero fixture incorrectly expects the old result shape from the new version; archive test now explicitly requests 2.0.0.
- Overfeeding UI calls heuristic scenario bounds a probability range. Correct terminology and localization are required.
- Recovery baseline currently counts records without checking distinct measurement dates/devices; introduce a dated baseline without changing archived runners.

## P1
- Body: propagate an explicitly entered BF uncertainty scenario to FM/LBM/FFMI/target; do not invent an error bar.
- Calories: formula/calibration/plan comparison, quality of actual records and scenario labels.
- Overfeeding: separate fat-equivalent scenario, glycogen-associated water and unmodelled gut/sodium components.
- Recovery: measured RHR/HRV/sleep timeline and device comparability, separate heuristic readiness.
- Progress: real dated 7/14/28-day windows, robust trend, observed spread, missingness and no silent outlier deletion.
- Strength: comparable lift history, optional RIR and protocol, formulas and reference load planning.
- Plates: preserve PR #13, add clear decimal parsing, optimized bounded search and symmetric diagram.
- Progression: actual multiple-session comparison with transparent rule failures.
- Caffeine: clock-time multiple sources, cumulative scenario timeline and last-dose comparison; preserve archived models.
- Summary: classify measurements/estimates/scenarios, show timestamp and data sufficiency.
- Art direction: create distinct focal scenes and quiet sections, improve LAB composition rather than duplicate the catalogue.

## P2
- Consistent finite result/details/diagram motion; respect keyboard, touch, reduced motion and Save-Data.
- Responsive and 200% typography, live regions, empty/error states, five/ten specified widths, all themes and languages.

## Evidence state
Before captures at `test-results/premium/before` use main 0a3b6da, 12 language/theme/viewport combinations and eight sections. npm ci passed. Initial 37 unit tests passed. Navigation regression (zero-position event plus existing scroll/deep-link scenarios) passed Chromium/Firefox/WebKit, RU/EN and three themes. Full final validation and scientific audit are still pending.
