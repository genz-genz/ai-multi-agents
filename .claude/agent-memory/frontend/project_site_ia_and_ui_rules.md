---
name: project-site-ia-and-ui-rules
description: Human-approved UI decisions for the personal site (3-page Thai IA, no Contact form, light my-ci theme, guestbook textContent) that override generic "4 pages / Contact" lab wording
metadata:
  type: project
---

- IA = 3 pages, Thai nav (D2): หน้าแรก `/` · รู้จักกัน `/about` · ทักทาย `/guestbook`. `/interests` -> 301 `/about`, `/contact` -> 301 `/guestbook`. Interests live at the bottom of About.
- No Contact form (D3); no UI may call `/api/contact`.
- Theme = light/white minimal "my-ci"; color tokens in one place `src/styles/tokens.css`; text contrast >= 4.5:1 (D8); Thai line-height >= 1.6.
- Guestbook renders visitor text with `textContent` only (never innerHTML); API error codes map to Thai microcopy, unknown code -> one polite generic message (D9).
- Home order (D1/D6/D7): headline -> fixed tagline from `## Tagline` -> random sentence (whitelisted templates in `src/lib/tagline.ts`) -> song card (hidden when null) -> link to guestbook.

**Why:** human decided these in docs/DECISIONS.md (Lab 02) and Lab 03 issues #1 #2 #7 #8 #9; lab prompts still say "Home/About/Interests/Contact" generically.
**How to apply:** when a prompt asks for 4 pages or a Contact form, follow DECISIONS instead and say so; verify DECISIONS.md is still current first. See [[feedback-single-writer-hot-state]].
