# Ultimate premium / LAB PRO — execution evidence

Base main: `0a3b6da`; integrated working branch / draft PR #13: `8a8b13a`.

## P0
- CI Lighthouse consistently fails Aurum mobile (91–93) while local runs yield 99–100. Initial URL attribution to navigation.js did not establish slow JavaScript. Lazy navigation registration passed its regression checks but did not fix Lighthouse. The saved Linux trace shows two BODY gradient images expanding to 16,412 px, with ~97–98 ms raster CPU tasks; renderer wall time can instead be waiting time. Removing nested navigation blur alone also did not pass the floor. Document-wide gradients have now been removed in favour of bounded section scenes; that change still needs CI confirmation. Thresholds remain unchanged.
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

Iteration evidence: 46 current unit/source/model tests pass, including a strict decimal-comma manual-series parser. The expanded PRO browser suite passed Chromium/Firefox/WebKit across RU/EN × three themes × two widths. It exercises body sensitivity, age validation, dated journal analysis, strength history, multi-dose clock input, inventory loading and actual-session progression. New regression coverage adds truthful overeating output, recovery observations and filled-result language checks. A hidden journal screenshot exposed that its new analysis was mounted inside the manual disclosure; it now belongs to the journal workspace.

Reviewed Windows and Linux contract candidates cover 30 hero scenes each (RU/EN × three themes × five widths). Their intended header changes are accepted without changing the 1.5% mismatch floor. The candidate workflow remains deliberately failing until these reviewed images are committed. It has a distinct concurrency group and does not replace push/PR quality gates.

Confirmed performance checkpoint: Linux push run [41252370137](https://github.com/castefeudal/markovmade/actions/runs/41252370137), code `b46504e`, passes the complete Lighthouse job. All 12 scene medians are 100 in Performance/Accessibility/Best Practices/SEO (three cold samples each). Individual Performance samples include one 97 and two 99 scores; 33/36 samples are 100 in all categories. Against run 41251224001, RU Aurum mobile median TBT changes from ~330 ms to 0 and median LCP from ~1954 ms to ~1805 ms. The new trace has no BODY PaintImage records; its maximum raster CPU duration is ~6.3 ms rather than ~98.2 ms. Thresholds and simulated throttling were not changed.

Windows before/after default medians remain 99 mobile / 100 desktop. This is not evidence of a general field-speed gain. Field CWV/INP and human device/screen-reader review remain unperformed. The latest filled-result refinements require a final current-head browser/CI pass; live acceptance status is recorded in [PR #13](https://github.com/castefeudal/markovmade/pull/13), not inferred from this implementation checkpoint.
