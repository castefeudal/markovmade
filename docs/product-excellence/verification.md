# Verification record

## Completed during implementation

- Dependency installation: `npm ci --prefer-offline --no-audit --no-fund`, 127 packages, no dependency/schema framework change.
- `npm run build`: generated `index.html` and `assets/dist/`, no generated-only edits.
- `npm test`: 60 tests passed, 0 failed; numerical legacy fixtures, comma-decimal/date validation, energy-conserving macros, meal labels/portions, analytics privacy and source contracts included.
- Focused meal browser verification: Chromium, Firefox and WebKit × RU/EN × three themes, 320/390/768/1440 and 200% at 320. Product/recipe reload, explicit diary prefill without writes, target-only/observed-zero distinction and task-group shortcuts passed.
- Focused services: three engines × RU/EN × three themes × five widths; native keyboard disclosures, original images and overflow passed.
- Today/contact: RU/EN × three themes; initial and real state, explicit diary consent, persistent tasks, one optional request, no readiness score and no generic demo footer on Today passed.
- Final responsive matrix: three engines × RU/EN × three themes × all nine requested widths × empty/real × normal/200% text and keyboard focus passed after the final desktop LAB/contact corrections.
- Input reach: 72 actual UI states (RU/EN × three themes × four mobile widths × QUICK/PRO/calibrated); worst first relevant field 851.30 px, existing limit 900 px retained.
- Final accessibility run passed all six locale/theme groups after persistent-link-underline and Clarity service-label contrast corrections; undecided checks remain in the generated `incomplete.json` and require human review.
- Streamed first paint passed all 24 locale/theme/width cases with measured CLS 0 after whole-hero readiness and English font-wrap corrections; final normal run also passed.
- Real before/after screenshots retained. Windows references and all 48 Linux hero/section references from exact source `eaf5f8e` were visually reviewed before acceptance; no mismatch tolerance changed.
- Local full e2e reached a WebKit header-hide timeout after text-size dialog closure. Focused WebKit passed twice; the test now explicitly awaits native dialog focus restoration before blurring and scrolling, with failure diagnostics retained. Product scroll behavior was not changed. The complete subsequent normal CI e2e command passed.
- Normal CI on `2bddf8d` subsequently found the same two Clarity alpha-text contrast problems. The final source uses opaque theme secondary text for those exact labels; the corrected generated build passed the full local accessibility suite. The final push triggers CI again; the earlier whole-workflow result is not represented as green.

## Final release gates

The branch is not production-qualified while any release blocker remains. The [36-sample Lighthouse matrix](https://github.com/castefeudal/markovmade/actions/runs/42906946667) and [trace investigation](performance-investigation.md) are retained. Normal final browser checks are recorded below; capture runs are not passing visual gates.

| Command / gate | Current status |
| --- | --- |
| `npm run test:e2e` | **Passed** the complete normal CI command on `2bddf8d` ([run](https://github.com/castefeudal/markovmade/actions/runs/42908943215)); local core and all remaining scripts also passed, with WebKit navigation verified twice after dialog synchronization |
| `npm run test:a11y` | **Passed** final generated build after fixing two Clarity alpha-text contrast failures. All six locale/theme groups; 17,376 undecided node checks across two rules retained for human review. |
| `npm run test:visual` | **Passed** normal local run: all 30 hero references, RU/EN × three themes × 320–2560 px, three browser engines and pointer/touch/reduced-motion contracts |
| `npm run test:paint` | **Passed** all 24 streamed locale/theme/width cases; measured CLS 0 |
| `npm run test:lighthouse` | **BLOCKER:** normal PR run on `2bddf8d`, 36 cold-site samples: RU Event Horizon mobile Performance median 94 (92/94/94), below unchanged 95. Earlier source run median 93 is retained in the investigation. Other eleven medians 99–100; all accessibility/best-practices/SEO medians 100. |
| Linux visual references / normal CI | All 48 reviewed references committed in `2bddf8d`; complete normal e2e passed without capture/update flags. Final Clarity contrast correction passed local unit and full accessibility checks; normal visual and first-paint checks also passed on the corrected build. |
| Production smoke | Not applicable before publication; run against the exact published SHA after release |

Lighthouse is a laboratory measurement. It does not establish field Core Web Vitals. Automated accessibility checks retain their undecided-item report and do not imply complete manual accessibility certification.
