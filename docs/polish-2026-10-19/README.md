# Motion and mobile finishing · 2026-10-19

The primary portrait now renders the prepared native poses before any MP4 metadata or decoder work. A four-core / 4 GiB device uses a bank of at most 48 MiB of retained RGBA surfaces; other devices retain the 96 MiB ceiling. These figures describe retained rendering surfaces, not total browser memory. The original MP4 remains an independent extraction/direct-seek fallback. Its absence no longer prevents following. Static touch, Save-Data and reduced-motion request neither MP4 nor prepared frames. Original image/video bytes and authored RU/EN text remain unchanged.

The original clip still limits yaw and upward movement: no mirrored face, artificial right-facing pose or photo rotation was introduced. Pointer input changes native face pixels, and leaving the hero eases back to neutral.

The finishing pass adds finite editorial arrivals, disclosure and LAB transitions, live cancellation for reduced-motion, more comfortable 16 px mobile intro text, larger service previews and touch actions, clearer service lead hierarchy and quiet hover/focus edges. Old overlapping service/LAB animation declarations are removed. No text is hidden pending an animation and no continuous scroll-linked animation runs.

Verification includes all three engines, actual pixel changes with MP4 blocked on four-core/4 GiB hardware, the smaller memory budget, keyboard focus during animated disclosure, finite completion and live reduced-motion cancellation. The source-copy seal and all calculation/data tests remain in the full suite. Visual thresholds are unchanged; the 12 changed Windows mobile contracts were reviewed before promotion. Final checks: [branch CI](https://github.com/castefeudal/markovmade/actions?query=branch%3Acodex%2Ffinal-polish-motion).

| View | Before | After |
|---|---|---|
| Mobile hero | [390 px](before-hero-390.png) | [390 px](after-hero-390.png) |
| Desktop hero | [1440 px](before-hero-1440.png) | [1440 px](after-hero-1440.png) |
| Expanded services | — | [Mobile](after-services-390.png) · [Desktop](after-services-1440.png) |

[Native pointer-following recording](native-pointer-following.webm): unedited browser capture at 1440 × 900 with four-core/4 GiB emulation and MP4 requests blocked. It demonstrates prepared native poses, not a mockup. Still images use reduced motion and neutral pose; section captures hide only external fixed navigation/progress controls and wait for photos to decode.
