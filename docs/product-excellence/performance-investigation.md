# Performance qualification

The [initial Linux diagnostic run](https://github.com/castefeudal/markovmade/actions/runs/42899731230) used three cold-site samples for every RU/EN, theme and mobile/desktop combination on source `264afdc5b6979f55b1b10932986f038d423d9fd4`.

All accessibility, best-practices and SEO medians were 100. Eleven Performance medians were 99–100. Russian Event Horizon mobile was **93**, below the unchanged release floor of **95**. It is a failed gate, not a successful release qualification.

## Observed evidence

Russian Event Horizon mobile samples scored 93/93/90, with TBT 316/295/398 ms. English Event Horizon scored 100/100/100 with TBT 0/0/0 ms. The Russian scene had a single unattributed native task of approximately 345–448 ms in the simulated report. JavaScript evaluation was only 40–56 ms; English evaluated more JavaScript, 49–59 ms, without blocking. CPU benchmark indices were comparable. Both languages loaded the same portrait AVIF, Manrope font and initial script set. LCP remained approximately 1.66–1.81 s, CLS 0.

The initial artifact did not save a detailed trace, so it cannot establish a native stack or distinguish rendering, decoding and scheduling costs. There is no basis to delete application modules or change numerical behavior to address this result.

## Controlled local diagnostic

Twelve serial CDP captures compared RU/EN Event Horizon, heading `text-wrap:balance` versus `wrap`, and three samples per combination under actual 4× CPU throttling. No repository source was changed for this experiment. Warm balanced Russian samples had no observed long tasks, matching `wrap`, and headline geometry was identical. A cold outlier's 340.59 ms wall task used only 2.018 ms thread CPU; nested animation servicing used 0.151 ms thread CPU during 176.879 ms wall time.

These measurements **do not prove that wrapping is the CI cause**, nor that changing it would achieve the Lighthouse floor. Actual CPU throttling in this diagnostic is not Lighthouse's simulated scoring. The local Lighthouse CLI stalled before page navigation; no local Lighthouse score is claimed from this experiment. No speculative wrapping change was shipped.

CI now saves the Lighthouse trace and DevTools log for only `ru-event-horizon-mobile` via `LIGHTHOUSE_TRACE_SCENE`, retaining the full normal matrix and its existing thresholds. The next normal run is the release gate. Earlier failed samples remain visible; a capture run or an image-reference update is not a substitute for normal validation.

Laboratory scores do not establish field Core Web Vitals. See [verification](verification.md) and the pull request checks for the latest actual qualification status.

## Final source CI trace — release blocker

The [normal matrix on source eaf5f8e](https://github.com/castefeudal/markovmade/actions/runs/42906946667), Lighthouse job `130147314078`, again failed the unchanged Performance floor. Russian Event Horizon mobile scored **94/93/91**, median **93 < 95**. The other eleven Performance medians were 99–100; accessibility, best practices and SEO were 100 throughout.

The three saved Linux traces identify a renderer-main native `RunTask` lasting **76.966 / 88.810 / 99.119 ms wall time**, but only **0.268 / 0.264 / 0.241 ms thread CPU**. In sample two, `BeginMainThreadFrame` is followed by approximately 88.6 ms without attributed nested work, then `PrePaint` takes 0.012 ms and `Commit` 0.072 ms. No JavaScript stack explains this task; ordinary application layout is about 5 ms at most in the adjacent expensive task. Lighthouse simulation expands the blocking task to 308 / 355 / 396 ms, yielding TBT 258 / 305 / 346 ms.

This is evidence of an off-CPU native rendering wait or descheduling interval, not proof of an expensive application algorithm. Its precise platform cause remains unresolved. The trace does not justify changing typography, removing application modules, altering formulas or weakening the 95 floor. No speculative performance change or blind rerun was made. **Performance remains a release blocker; this source is not production-qualified.** Artifacts were inspected under `D:\Temp\precision-lighthouse-eaf5f8e`.
