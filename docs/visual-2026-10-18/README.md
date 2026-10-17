# Visual review · 2026-10-18

Before: commit 94e60ee. After: runtime source in a96d3f9 (deferred video URL leaves the static composition unchanged). Same RU/Aurum Noir viewport sizes, reduced motion, neutral portrait, clean browser storage. Screenshots are browser output without image retouching. Isolated sections hide fixed page navigation and the scroll-progress line for capture only. The normal hero viewport keeps page chrome.

| View | Before | After |
| --- | --- | --- |
| Hero · 1440 × 900 | [Before](hero-before-1440.png) | [After](hero-after-1440.png) |
| Hero · 390 × 844 | [Before](hero-before-390.png) | [After](hero-after-390.png) |

| New interface | Desktop | Mobile |
| --- | --- | --- |
| Expanded service | [1440](services-expanded-1440.png) | [390](services-expanded-390.png) |
| Empty progress journal, explicitly opened | [1440](progress-empty-1440.png) | [390](progress-empty-390.png) |
| Calendar graph, 28 synthetic QA readings | [1440](progress-QA-fixture-1440.png) | [390](progress-QA-fixture-390.png) |

The graph fixture is test data, never a client result. Before/after section and full matrix screenshots remain in test-results/ultimate and browser workflow artifacts. Reproduce current captures with `node scripts/capture-flagship.cjs` after `npm run build`. This command does not update visual baselines.
