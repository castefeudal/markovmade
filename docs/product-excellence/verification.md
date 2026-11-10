# Verification record

## Completed during implementation

- Dependency installation: `npm ci --prefer-offline --no-audit --no-fund`, 127 packages, no dependency/schema framework change.
- `npm run build`: generated `index.html` and `assets/dist/`, no generated-only edits.
- `npm test`: 60 tests passed, 0 failed; numerical legacy fixtures, comma-decimal/date validation, energy-conserving macros, meal labels/portions, analytics privacy and source contracts included.
- Focused meal browser verification: Chromium, Firefox and WebKit × RU/EN × three themes, 320/390/768/1440 and 200% at 320. Product/recipe reload, explicit diary prefill without writes, target-only/observed-zero distinction and task-group shortcuts passed.
- Focused services: three engines × RU/EN × three themes × five widths; native keyboard disclosures, original images and overflow passed.
- Today/contact: RU/EN × three themes; initial and real state, explicit diary consent, persistent tasks, one optional request, no readiness score and no generic demo footer on Today passed.
- New responsive matrix: three engines × RU/EN × three themes × all nine requested widths × empty/real × normal/200% text and keyboard focus passed during implementation. Final full-suite rerun follows the last desktop LAB layout correction.
- Input reach: 72 actual UI states (RU/EN × three themes × four mobile widths × QUICK/PRO/calibrated); worst first relevant field 851.30 px, existing limit 900 px retained.
- Accessibility run passed all six locale/theme groups after persistent-link-underline correction; undecided checks remain in the generated `incomplete.json` and require human review.
- Streamed first paint passed all 24 locale/theme/width cases with measured CLS 0 after whole-hero readiness and English font-wrap corrections; final normal run pending.
- Real before/after screenshots retained. Windows hero and section candidates reviewed before acceptance; no mismatch tolerance changed.

## Final release gates

The complete normal runs, final Lighthouse matrix, and Linux visual references are still being validated on this branch. Until the entries below are replaced with actual results, they are release blockers rather than passing checks.

| Command / gate | Current status |
| --- | --- |
| `npm run test:e2e` | Final normal run in progress |
| `npm run test:a11y` | Final normal run pending |
| `npm run test:visual` | Final normal run pending; reviewed Windows references accepted |
| `npm run test:paint` | Final normal run pending |
| `npm run test:lighthouse` | Final RU/EN × three themes × mobile/desktop matrix pending |
| Linux visual references / normal CI | Pending candidate capture, review and normal validation |
| Production smoke | Not applicable before publication; run against the exact published SHA after release |

Lighthouse is a laboratory measurement. It does not establish field Core Web Vitals. Automated accessibility checks retain their undecided-item report and do not imply complete manual accessibility certification.
