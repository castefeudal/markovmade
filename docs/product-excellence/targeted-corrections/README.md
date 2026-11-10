# Services and contact correction

The three service directions are again **Мужская трансформация**, **Женская трансформация**, and **Менторство и коучинг**, with RU/EN names and the previous direction-specific descriptions. Strength, conditioning and mentorship media are restored. Nutrition remains part of the transformation descriptions. The existing native keyboard disclosures and contact links remain functional.

Contact now follows a two-column editorial grid on desktop and one column below 768 px. A clear Telegram button, secondary WhatsApp button, privacy copy and email form one group. The optional request occupies the row below. The section uses theme surfaces and typography without the unrelated decorative diagram.

Scope: service component, contact component, their editorial CSS and matching English dictionary; generated output and exact authored-copy seals are rebuilt. No calculator, storage or analytics code changes.

| Screen | Before mobile | Corrected mobile | Before desktop | Corrected desktop |
| --- | --- | --- | --- | --- |
| Services | [390](../after/services-390.png) | [390](services-390.png) | [1440](../after/services-1440.png) | [1440](services-1440.png) |
| Contact | [390](../after/contact-390.png) | [390](contact-390.png) | [1440](../after/contact-1440.png) | [1440](contact-1440.png) |

The images are actual browser screenshots. Before images are the preceding Product Excellence implementation, not concept renders. The reproducible `node scripts/contact-service-evidence.cjs` captures all three themes and RU/EN under `test-results/contact-service-corrections` and checks the names, section bounds, optional request and absence of the contact illustration.

Validation: build and 60 unit/source tests passed. Services passed Chromium/Firefox/WebKit × RU/EN × three themes × five widths, including keyboard disclosures, original media and overflow. Existing Today/contact tests passed all six locale/theme combinations. Targeted screenshot checks passed four widths and normal/200% text; long section labels wrap and service index columns grow with text. Full accessibility passed all six locale/theme groups; undecided axe findings remain available for human review.
