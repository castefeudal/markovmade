# Grand Edition implementation review — 2026-11-02

Base: origin/main `0a3b6da03087ad40870d7a06b4542b84ba35de54`. Isolated branch: `codex/markovmade-grand-edition`. Existing LAB PRO worktree was left intact.

## Model review and decisions

| Instrument | Decision and practical result | Version / limits |
| --- | --- | --- |
| Body / recomposition | Retain Navy, FFM, FFMI, normalised FFMI, BMI, WHtR, method provenance and sensitivity scenarios; add a model-linked mass diagram | No medical scan; FFM includes water and organs; source body model unchanged |
| Nutrition / protein | Retain Mifflin / ten Haaf / PAL and existing observed 14–28-day calibration from dated daily journal; replace the unvalidated noise/√n interval with an explicit editable calorie-logging error scenario; reject impossible protein/fat budgets and bound the selected macro allocation; show separate RMR/TDEE/target bars | Nutrition 2.0.0; bars are independent references, not additive components |
| Overfeeding | Explicit entire-period / daily-average / single-day basis; reject multi-day single-day input; remove second TEF deduction and arbitrary storage efficiencies | 2.0.0; 7000–9000 kcal/kg is selected scenario sensitivity, not statistical coverage or a validated tissue forecast |
| Recovery / sleep / fatigue | Primary output is the observed limiting signal; new decisions use explicit raw-signal review thresholds; old snapshots retain their legacy scores; show observed RHR against personal median where enough history exists | Recovery 3.0.0; no diagnosis, validated readiness test or universal HRV cutoff |
| Progress | Preserve dated journal and legacy daily sequences; accept YYYY-MM-DD=kg in PRO; calendar spacing enters Theil–Sen and plot coordinates; suppress plateau/ETA for gapped observations | 2.0.0; missing dates remain missing; raw measurements and explicit outlier choices retained |
| Circumference | Replace two-point arithmetic with at least three dated observations, robust slope and accessible observation table | 3.0.0; old 2.0.0 calculations remain reproducible |
| Phase duration | Remove standalone linear deadline projection from visible scenarios; retain the old definition for historical compatibility | No fabricated deadline or planning interval added |
| Strength | Separate Epley and Brzycki; equipment/variation, date, set count, RIR, set type; comparison only within matching model/exercise/equipment/type; measured single distinguished from RIR heuristic | 2.0.0; primary formula is Epley, never a mechanical mean; large rep counts reduce confidence |
| Working loads / progression / volume | Retain explicit % and RIR scenario, conservative comparability-gated double progression and per-set exact tonnage; add a multi-exercise set editor and plan versus actual with named exercises, date, RIR, rest, manual muscle assignments and a seven-day direct-set summary; add downward rounding, formula sensitivity and conservative progression reduction | Session 2.0.0; load/progression 3.0.0; no tonnage-to-hypertrophy score; plan and observations remain separate |
| Barbell | Integer-gram bounded subset sum with bounded typed-array memory, minimum plates per reachable mass, collars, symmetric SVG, nearest lower and upper, live unsaved preview | 3.0.0; each inventory number is one plate per side, repeat denominations for quantities; real plate tolerances unknown |
| Caffeine | Multiple timestamped doses, midnight rollover, 3/5/7-hour scenarios, explicit 5-hour residual curve and bedtime marker | 3.0.0; clock entries are the previous 24 hours; same clock time means at bedtime; no insomnia prediction |

No historical snapshots are rewritten. Current calculations save their current model version. Previous toolkit 2.0.0 runners remain available for reproduction. New session records use existing private history/export/import rather than a second storage system.

## Scientific sources checked

- [ACSM Position Stand 2026](https://pubmed.ncbi.nlm.nih.gov/41843416/) and [official ACSM summary](https://acsm.org/resistance-training-guidelines-update-2026/). This supports general resistance-training context, not external validation of the product's progression thresholds.
- [Brzycki 1993](https://doi.org/10.1080/07303084.1993.10606684). Epley and Brzycki arithmetic are exposed separately. Neither equation measures a true maximum.
- [Mifflin et al. 1990](https://pubmed.ncbi.nlm.nih.gov/2305711/). RMR is a prediction; PAL already includes daily expenditure context.
- [Hall et al. 2011](https://pubmed.ncbi.nlm.nih.gov/21872751/). Dynamic changes limit static energy-to-weight scenarios. This implementation does not claim to implement Hall's dynamic model.
- [Drake et al. 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3805807/) and [dose/timing crossover trial](https://doi.org/10.1093/sleep/zsae230). Residual caffeine scenarios are not sleep-outcome prediction models.

## Art direction and performance

Six local authored vector scenes: equipment engineering, organic contours, energy fields, signal coordinates, connected module blueprint, editorial architecture. Used across LAB, services, biography, method, Personal OS, Insights and contact, with three theme atmospheres and reduced-motion treatment. Hero retains genuine portrait media and crop, with refined proof band and type spacing. Data diagrams are distinct from decorative scenes and include explanatory labels.

The previous CI artifact (`41243547286`) attributed a 386 ms long task to navigation. Navigation's document-wide observers now wait for actual scroll, and zero-position bootstrap scroll events do not materialise the deferred page. Local Lighthouse median before final refinements: mobile 97 / desktop 100; other categories 100. The first run was noisy during concurrent QA (73); it is retained in the report rather than hidden. CI matrix remains the release gate; no thresholds or baseline tolerances reduced.

## Verification

45 unit tests initially pass, including ten new deterministic model tests. Dedicated Grand browser test covers RU/EN × three themes × widths 320, 360, 390, 428, 768, 1024, 1440, 1920 and 2560; plate symmetry, multi-dose midnight scenarios, exact plan/actual tonnage and reload persistence. Existing browser, accessibility, paint, visual, Lighthouse and production gates remain required. Final CI/deployment evidence is linked in the PR.

Axe's automated checks leave background-image contrast checks incomplete; no claim of human accessibility certification or field CWV/INP is made. Visual screenshots are review evidence, not proof of subjective design excellence. Authored-copy seal changes are limited to two deliberately corrected readiness phrases and new localisation entries; visual baselines are not regenerated.


## Completion pass after pause

The mobile header now remains visible while its controls have keyboard focus. Off-screen sections keep intrinsic placeholders until their stylesheet is requested by navigation, wheel, touch, scrolling or keyboard intent; CSS failure releases readable fallback content. This avoids materialising the browser's large eager content-visibility proximity range during first paint.

Nutrition PRO defaults to inclusive PAL rather than adding steps and training on top. The separate component scenario explicitly requires non-training steps and user-entered other activity; the undocumented occupational multipliers were removed. Logging-error bounds are editable scenario assumptions, not statistical uncertainty estimates. Overfeeding's method disclosure now matches the actual energy arithmetic, including possible positive upper scenarios when central surplus is zero.

Recovery 3.0.0 no longer exports a newly computed readiness score into the dashboard, history or Personal OS. Its raw-signal rules are explicitly heuristic, and the previous weighted number is kept only in a legacy field. New session 2.0.0 can contain multiple exercises; primary muscle assignments are manual, indirect sets are not inferred, and weekly completeness is stated. Previous session 1.0.0, load 2.0.0 and progression 2.0.0/2.1.0 runners remain reproducible.
