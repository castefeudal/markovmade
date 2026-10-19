# Final audit — 20 October 2026

Scope: source, static build, responsive presentation, RU/EN, three themes, navigation and keyboard interactions, local LAB data, Personal OS, native portrait following, accessibility, streaming paint and release integrity. This is a product audit, not an objective ranking of the internet or a WCAG certification.

## Findings and changes

| Finding | Consequence | Resolution |
| --- | --- | --- |
| History accepted invalid timestamps and inherited tool names | One damaged local entry could interrupt the history renderer | Filter invalid stored entries without rewriting the archive; reject invalid backup history before any writes |
| Snapshot write failure was ignored | A calculation appeared complete without explaining that its history was not retained | Announce failure through the existing bilingual live status region; keep previous snapshots |
| Overfeeding snapshot assumed both interval endpoints existed | A partial result could throw during rendering | Require both finite endpoints before formatting |
| Mobile dialog left the header exposed | Background theme/language controls remained outside the modal's interaction boundary | Make the header inert while open; restore it before returning focus |
| Closing an already closed menu reused its previous opener | Later anchor clicks could unnecessarily refocus the old menu button | Consume the saved focus target once, with preventScroll |
| Personal OS task completion used Russian literals | English users saw Russian state changes | Own task status localization, including completed states and language switching |

## Preserved contracts

Authored component wording and dictionaries, native source media and crop, calculation models, backup schema, local-only storage, consent, static deployment and reduced-motion behavior remain in place. Existing good local history survives; invalid entries are ignored in the view rather than deleted on read.

## Verification

The audit adds `tests/audit-resilience.cjs` to the normal browser gate. It exercises corrupted history, rejected imports with unchanged storage, quota failure feedback, mobile modal isolation and bilingual task completion in Chromium, Firefox and WebKit. Existing gates cover 23 catalogue tools, daily journal gaps and import rollback, RU/EN and three themes, responsive layouts from 320 to 2560 pixels, native pointer following, deferred-loading retries, Axe checks and streaming paint. Results and release SHA are recorded after the final runs; a test inventory is not itself a passing result.

No claim is made that automated testing replaces human usability research, a formal accessibility assessment, or an independently measured market ranking.
