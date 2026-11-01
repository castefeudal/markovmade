# MARKOVMADE / LAB PRO audit · 2026-11-01

Base: `main` commit `0a3b6da03087ad40870d7a06b4542b84ba35de54`.

## Verified baseline
- One unified LAB panel with nine primary tabs and embedded scenarios; three existing themes.
- Last main Quality check: **failure only in Lighthouse**; browser/visual/accessibility and unit/source jobs passed. Pages deployment passed.
- Previous visual pass shipped three small semantic SVG scenes, not generated photorealistic illustrations.
- This audit is source-level. Do not claim a pixel-verified 10/10 redesign or field-measured 60 fps.

## High-impact calculation gaps
1. Caffeine: previous calculator simulated one dose only, while repeated intake is common. PRO option now sums independently entered doses, shows three assumed half-lives, and warns that modeled residual is neither measured concentration nor a sleep prediction. Model version 2.2.0. Existing imported 2.0.0 snapshots use their original runner.
2. Bar plates: previous calculator silently omitted collars and offered only the nearest reachable load **below** a target. PRO option handles collars, identifies exact matches, and supplies a nearest higher comparison without recommending an automatic increase. Model version 2.2.0; old runner preserved for 2.0.0 snapshots.
3. Results: include transparent per-side loading arithmetic and visual display of all entered caffeine doses and model assumptions. Palette tokens, accessible native meters, bilingual copy and mobile controls.
4. Regression protection: numerical unit tests for weights, collars, candidate comparisons, caffeine summation and archived model versions.

## Further priority work (not implemented here)
- Measure failed Lighthouse workflow and reproduce its failing scene before changing hero/media or quality gates.
- Audit TDEE against *observed* 14-28-day weight and logged intake; distinguish predictions from calibration and display uncertainty rather than spurious exact numbers.
- Validate Navy body-fat limitations for lean athletes, BF-method measurement error, and the interpretation of FFMI. Never overclaim muscular potential from population equations.
- Strength: pair e1RM with RIR, exercise-specific repeatability and measured history; distinguish tonnage from effective training volume. Avoid confident adjustments after a single session.
- Recovery: preserve baseline evidence quality; avoid treating heuristic readiness as diagnosis. Make sleep/HRV variability visible before recommending a deload.
- For the visual redesign, review authentic hero/case photographs, typographic hierarchy, nine-tab navigation and calculated results at 320/390/768/1440/1920/2560, RU/EN and all themes, including reduced-motion, keyboard and Save-Data.
- Existing hand-built SVG background assets can be refined through section-specific, production-ready art direction; do not add random generated photographs, fictitious case imagery or unnecessary JS animation.

## Release checklist
1. Build using `npm ci && npm run build` (commit regenerated `assets/dist` and `index.html` for GitHub Pages).
2. Run `npm test`, `npm run test:e2e`, `npm run test:a11y`, `npm run test:visual`, `npm run test:paint`, `npm run test:lighthouse`.
3. Reproduce and diagnose CI Lighthouse failure, don't reduce thresholds.
4. Capture and personally compare screenshots before/after, only then update pixel baselines.
5. Validate full import/export and old model snapshots; browser refresh and deep links to new panels.
6. Keep this PR as a **draft** until generated build and browser QA pass. Do not merge partially built source changes.

## Evidence
- https://github.com/castefeudal/markovmade/actions/runs/41243547286
- https://github.com/castefeudal/markovmade/tree/main/docs
