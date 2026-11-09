# MARKOVMADE Signature — 9 November 2026

Base: `2e0ead3` (`origin/main`). Worktree: `markovmade-signature`.

This change develops the existing Grand/Beyond interfaces. The nine LAB
directions, nested models, five Personal OS tabs, consent, diary, exports,
translations, real portrait/video and navigation remain the existing product.
The previous branches and their working trees were not edited.

## Delivered changes

- Theme Studio uses actual browser captures of the three interfaces, rather
  than an invented “84 / READY” metric. The six RU/EN WebP previews load only when
  the dialog is opened, with three requested for the active language.
- Card selection previews a theme. A separate Save appearance action commits
  it; Cancel, Escape and dismissal restore the committed appearance and focus.
  Both `mm.theme` and the legacy `markov-theme` key remain supported, including
  aliases and shared URL parameters. Hover preview ignores touch pointer entry.
- Responsive dialog layout reserves room for its actions. At short viewports
  or enlarged text it falls back to scrolling the whole sheet, avoiding a
  zero-height list of choices. Accessible button names use their visible text.
- Semantic editorial and instrument radius tokens distinguish Aurum's soft
  architecture, Horizon's precise corners and Clarity's restrained paper forms.
  Hero uses theme-specific architectural fields without changing portrait bytes,
  crop, motion poses or hit targets. Duplicate Hero rules are consolidated.
- Qualifications return to an editorial evidence ledger instead of competing
  card overrides. Service, contact, chart and report surfaces consume the theme
  geometry tokens in their existing presentation owner.
- Removed an unrelated global transparent-button reset from `author.css` that
  overrode component materials, including Theme Studio's confirmation action.
- The 404 source now lives at `src/404.html`. The standard build injects the
  main page's exact early appearance bootstrap and uses the shared palette.
  Absolute GitHub Pages assets keep it working from unknown nested URLs.
- Browser coverage includes explicit preview/cancel/save, touch at 320×568,
  both languages, URL/storage compatibility and restored focus in all engines.
  Existing theme consumers explicitly confirm selection. Source checks retain
  their original hashes outside enumerated Theme Studio UI edits.
- Responsive portrait checks wait for a stable `currentSrc` when a resize
  replaces an image during decoding; a decode error on the same source fails.

## Evidence and reproducibility

`node tests/signature-review.cjs` captures before/after Hero, LAB, Personal OS,
Contact and Theme Studio at 390 and 1440 px in RU/EN and all three themes.
The before capture routes only changed built resources from the fixed base
commit; photos and other resources are shared. It also checks page overflow at
320 / 360 / 390 / 428 / 600 / 768 / 1024 / 1280 / 1440 / 1920 / 2560 px and
captures the 404 in each theme. `SIGNATURE_STAGE=after` refreshes only the final
captures. These are review artifacts, not automatically approved baselines.

Comparisons use **before on the left / after on the right**; rows are Aurum
Noir, Event Horizon and Clarity. These are actual browser screenshots:

- [Hero](signature-evidence/compare-hero.png)
- [LAB](signature-evidence/compare-lab.png)
- [Personal OS](signature-evidence/compare-os.png)
- [Contact](signature-evidence/compare-contact.png)
- [Theme Studio](signature-evidence/compare-studio.png)

Only reviewed Theme Studio baselines should change. Existing comparison
thresholds and the other visual references remain in force.

## Validation status

| Check | Local result |
| --- | --- |
| `npm ci` | Passed |
| `npm run build` | Passed; generated `index.html`, `404.html`, `assets/dist/` |
| `npm test` | 48/48 passed |
| `npm run test:e2e` | Complete pipeline status is recorded in PR #19 Quality checks; component logs are retained locally |
| `npm run test:a11y` | Passed RU/EN × three themes, LAB/OS/dialogs; axe still leaves contrast checks for manual review |
| `npm run test:visual` | Passed Chromium/Firefox/WebKit, RU/EN, three themes, 320–2560; real video poses and touch/reduced motion |
| `npm run test:paint` | Passed 24 streaming scenes; maximum observed CLS 0.00069 |
| `npm run test:lighthouse` | Three cold-site runs: median mobile 98, desktop 100; A/BP/SEO 100 |
| `node tests/signature-browser.cjs` | All three engines; RU/EN, keyboard/touch, preview/cancel/save, storage/URL/focus |
| `node tests/signature-review.cjs` | Real before/after captures and responsive/404 checks passed |
| `npm run audit:contrast -- <theme> 390 844` | Painted-pixel samples: Aurum 504, Horizon 498, Clarity 499 text runs; no sampled run below AA (sampling does not replace a full manual audit) |
| `git diff --check` | Passed |
| `npm run test:production` | Not run: this PR has not been deployed |

Mobile Lighthouse LCP samples were 1.932 / 2.075 / 2.168 seconds, with CLS 0.
These are local laboratory observations. Logs are under
`test-results/signature-*.log`; CI results and Linux baseline review follow in
the PR.

There is no production claim before this PR is merged and its matching Pages
build is published. `test:production` checks exact served bytes and must run
against that publication. Laboratory CLS/Lighthouse do not establish field INP
or field Core Web Vitals. Physical device and manual screen-reader review are
separate from the automated browser matrix.

`npm ci` completed. Its audit reported four existing development-tool dependency
findings (one moderate, three high); no runtime dependency was added. Dependency
upgrades are not bundled into the visual change.

## Linux visual review

The [Linux candidate run](https://github.com/castefeudal/markovmade/actions/runs/42693805418)
captured real UI images at `206b5e8`. Both changed Theme Studio images were
opened and reviewed at their original dimensions before copying **only those
two files** into `tests/visual-baselines/linux/`. Windows counterparts were
likewise reviewed. No mismatch threshold changed. The 30 Linux Hero contract
captures still compare within the existing 10% threshold against their original
references; 10 matching UI captures also compared successfully after the two
intentional picker updates. Final acceptance is the PR's normal Quality job,
not the capture workflow (which deliberately permits failing capture steps).
