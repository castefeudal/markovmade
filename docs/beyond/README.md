# Beyond Excellence — art and interaction record

Base main: b2e333f0fdd6b52d794290593ea869c0ae40c12e. Worktree: markovmade-beyond; branch codex/markovmade-beyond.

## Concept review / Pass 1

Nine actual viewport captures compare Liquid Luxury (A), Cinematic Instrument (B) and Editorial Magnetic (C) across Aurum, Horizon and Clarity. Review-only overrides live in tests/fixtures/beyond-concepts.css; they are not shipped to production.

Selected A: one continuous material makes the controls and identity coherent, and has the strongest independent ceramic expression. B's split objects are precise but weaken the composition's unity. C feels editorial, but leaves the logo less connected to navigation. The selected A keeps the instrument-like precision of the moving marker. All three studies are retained in this directory.

The static header now has a single component owner. Its hit boxes remain stationary. A separate intent-loaded presentation module owns one settling spring scheduler, decorative coordinates and the shared marker; navigation.js continues to be the only section-tracking owner. The physical photograph and head-motion sources are untouched.

## Preservation contract

The existing SHA-256 source manifest remains unchanged. Exactly marked presentation regions in theme-system.js (explicit theme confirmation/dismissal only), site-interactions.js (the old uncached ambient-light handler) and media-interactions.js (editorial animation only) can differ; the guard restores the exact original region from a fixture and checks the original whole-file hash. Theme persistence, model logic, Insights, data and all other source bytes remain sealed. The previous report-focus attribute exception remains explicit.

## Five-pass sequence

2. Interaction mastering: actual pixels, geometry stability, shared indicator, spring return, preference changes, keyboard/touch/Save-Data, theme transition, no per-move layout reads.
3. Visual reconstruction: Hero, control families, layered cards, LAB, Personal OS, editorial worlds, 404 and error/empty views.
4. Optical perfection: inspect new screenshots, reflow, contrast, mobile menu and long labels; remove conflicting motion owners.
5. Real-world quality: complete browser/unit/accessibility/paint/Lighthouse matrix, reviewed per-platform references, CI, PR, Pages and production bytes/smoke. No baseline threshold changes.


### Interaction finding

Firefox exposed an input interception during hover-driven root View Transitions: preview colour changed but the actual selection click never reached the button. The final ownership keeps all original preview painting synchronous and byte-identical. Native transitions are started only after an explicit selection click, around dialog dismissal; snapshot pseudo-elements are pointer-transparent. This reveals the confirmed world from the control without interrupting preview or preference persistence. The test checks real dialog closure, stored preference and restored focus, not merely the new palette.
## Pass 2 — Interaction mastering

The actual hover captures show a moving marker and local light across all six language/theme contexts. Chromium and Firefox pass stable geometry, settling return, cached pointer reads, reduced-motion cancellation, current-section tracking, compact material, confirmed theme persistence/closure/focus, language switching, touch, Save-Data and nine required widths. Windows WebKit uses Windows display scaling and its native keyboard preference skips links in the Tab sequence; the test normalizes the CSS viewport and checks native-control keyboard focus before explicitly checking navigation focus styling. The final run passes all six scenes, touch and Save-Data in WebKit too; Windows touch protocol coordinates are converted from CSS pixels to the backing window, then real menu opening is asserted.

## Pass 3 — Visual reconstruction

Hero has an architectural rail, framed identity and proof ledger. LAB is a numbered vertical instrument bay on wide screens and a horizontal touch rail on smaller screens. Result, field, primary/secondary, metric and decision families have independent hierarchy. Personal OS has a framed application surface, sticky tab row, consent, empty decision and metrics. Services are photo-led indexed disclosures; proof is a qualification ledger, biography uses numeric ages with a readable LEGACY label, method retains blueprint sequencing, and community/contact/FAQ have distinct material geometry. Three worlds retain independent palette, typography, radii and material. No new image substitutes the original portrait or documentary photographs.

## Pass 4 — Optical perfection

Captured 18 RU/EN × three-world × 390/768/1440 scenarios, each with 12 sections, nine tool views and all five OS panels. Reviewed Hero, service, biography, LAB, strength forms, OS and contact views directly and in contact sheets. Fixed legacy unlayered experience rules that overrode component owners; removed duplicate panel-entry animation rules. Header is now the sole geometry/material owner. Original 30 hero contracts and 18 UI reference candidates were separately reviewed on Windows before approval; no mismatch thresholds changed. The final full CSS is 403840 bytes and shell critical CSS 60355 bytes, smaller than the intermediate pass.

## Pass 5 — Real-world quality (in progress)

48 unit/source checks pass. Axe reports no violations across RU/EN, three themes, four widths, nine LAB tools, five OS tabs and dialogs; automated contrast has incomplete checks on layered backgrounds and is supplemented by the explicit contrast contracts. All three engines pass the 320–2560 composition/contrast matrix, the magnetic interaction suite and 200% text reflow. The four service disclosures pass in three engines, RU/EN, three themes and five widths. The 404 surface was inspected at 320 and 1440 pixels.

The isolated three-sample Lighthouse run passes with mobile median 99/100/100/100 and desktop 100/100/100/100. A prior run overlapping several browser suites failed due to host contention and is not treated as a passing performance result. The delayed-stream/delayed-font paint matrix passes all 24 contexts with CLS below .001. Formula, storage and behavior hashes retain their original manifest.

Release authority is the normal, non-refresh Quality run on the final pushed SHA, followed by merge, main Quality, Pages build commit equality and production byte/functional/magnetic smoke. The live release/check links are maintained in [PR #16](https://github.com/castefeudal/markovmade/pull/16); a capture-only workflow never counts as a passing release.

See interaction-inventory.md for state ownership and static fallbacks. Local intermediate evidence is under ignored test-results/beyond and test-results/visual-excellence/beyond-pass-4; Linux release evidence is retained by CI.
### Final optical corrections

Restored `object-fit:contain` for service previews after the functional photograph contract caught cropping. All three engines now pass all four disclosures, both languages, three themes and five widths. The 200% Firefox reflow run exposed a long-word/metadata overflow in the day decision; it is corrected with wrapping and flexible metadata, without reducing type size. Native scroll-timeline enhancement fades only the opening architectural rail during exit, with a static fallback; page restoration rearms the motion observers. Reviewed all 48 Linux reference candidates from workflow 41615359696 before copying them. Unchanged tolerances apply to the following normal runs.

### Cold-load correction

An actual 800ms module-delay test reproduced a stale first pointer: after leaving the header before the module arrived, its shell settled at x=2.303px. The loader now retains only the newest native pointer event while loading, clears it on leave/blur, replays it once and removes temporary tracking listeners. This also carries a first touch pointer type into the enhancement on hybrid devices. The interaction suite repeats the delayed quick-exit scenario in every engine.
The full-content navigation/marker integration assertions wait for LAB, OS, editorial content and translation to finish loading before measuring the document. Deferred-resource behavior is exercised separately by the cold-motion and existing navigation-loading tests. A focused manual Linux workflow is available for diagnosing motion independently of the full release gate, and navigation failures retain an actual screenshot and geometry/current-section state.

### Smooth-anchor landing

Focused Linux diagnostics captured a real Firefox landing failure: the services link held keyboard focus while services remained 1315px below the viewport and aria-current correctly still pointed at LAB. Deferred content-visibility sizing had moved the native smooth-scroll endpoint. The existing navigation owner now aligns the chosen anchor once after 160ms without scroll events, bounds the transaction at 2.5s, and cancels on wheel, touch, pointer, keyboard or page leave. No scroll-frame layout reads, extra section tracker or model changes were added. Its two exact additive presentation regions are stripped before checking the original navigation source hash.
The landing interruption test uses an actual wheel event and verifies that scroll position does not resume toward the anchor afterwards. WebKit required explicitly stopping its native animation as well as cancelling the finite alignment and the pending two-frame navigation callback; a same-task one-pixel reset avoids WebKit ignoring a stop at an identical position. The reset is restored before paint. Chromium, Firefox and WebKit pass the local real-input cancellation check.

### First-paint raster work

Same-host base/current Chrome traces show a long BeginMainThreadFrame waiting on raster work rather than a JavaScript handler. New header paint clips extended about 7000px beyond its small capsule. The container now bounds paint with a 64px optical margin, and coarse/reduced-motion modes use a 2D compact transform instead of forcing idle 3D layers. The same-host trace comparison and unchanged full Lighthouse floors validate this correction; no asset, model or score condition is replaced.

The same-host trace also reproduces raster stalls in the original base. Aurum's two body lights were sized to the complete document height, despite becoming transparent after 34rem/30rem. Their texture boxes are now bounded to the visible radii; the second background-position compensates its 60rem box so its center remains exactly at 18% of the body. Colours, visible geometry and the photographic assets remain the same. Diagnostic tracing is available manually or on commits explicitly marked raster, rather than on ordinary motion changes.

Measured correction: on the same roughly 3000 benchmark-index host, the base RU/Aurum median is 94 with 134-182ms simulated TBT. Current is 96 with zero TBT in samples 2 and 3; its first diagnostic cold-browser sample is 89 and remains visible in the trace report. The heaviest current raster task falls to 16ms from about 120ms. All six reviewed Aurum section screenshots are pixel-identical after bounding the body textures; the 18-section comparison stays below 0.038% changed pixels. The normal release matrix, with its existing browser-infrastructure warmup and three cold-site samples, remains the acceptance gate.

The final action check also measures the real Hero arrow offset and stationary CTA box in all 18 engine/language/theme scenes. The SVG selector uses last-of-type so the aria-hidden appended light element cannot suppress its directional hover state.

## Production cold-paint follow-up

Public first-pointer verification caught an 8px navigation shift before the full section stylesheet loaded. The contact button received an unstyled inline light child, creating one additional flex gap. The critical extractor now retains transient motion-layer structural rules, so every light is absolute and pointer-transparent from the first intent. The delayed-module cold test checks all header-link and Hero CTA bounds without loading section CSS, in all three engines. Production asset bytes and calculator smoke passed before this narrow correction; the follow-up receives its own normal CI and release verification.

## Cold keyboard utility follow-up

A public cold header capture exposed the skip-to-main link as an unstyled blue line before section CSS. The shell extractor now explicitly retains its existing hidden/default and visible/focus rules. A separate real-keyboard test blocks section CSS, checks that the link begins above the viewport and becomes visible when focused. The authored link and navigation behavior remain intact.

The existing authored English skip label is included in the critical translation subset and the same original-text WeakMap as other shell copy. The utility check runs in RU and EN with section CSS blocked; the exact language-loader selector addition is normalized before the original source hash comparison.
