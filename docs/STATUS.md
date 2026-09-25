# Project Status

> อ่านทุก session · **สั้น** · single-writer ต่อรอบ  
> ดู [`COURSE.md`](../COURSE.md) ชั้น State (Hot)

Last updated: 2026-09-25 14:35 +07:00  
Updated by: Claude

## Current goal

- Lab 04 frontend เสร็จ (PR `lab-04-frontend`) → ถัดไป Lab 05 backend (OpenCode · L10)

## Done

- **D11 player ในการ์ดเพลง** (Claude): Apple Music embed (iframe) ใน `index.astro` · `src/lib/embed.ts` แปลงลิงก์ชาร์ตเป็น `embed.music.apple.com` (ไม่ใช้ API · ไม่แตะ `music.ts`) · ลิงก์ "ฟังต่อบน Apple Music ↗" ยังอยู่ · `npm test` 32/32 + build ผ่าน · build จริงกด Play แล้วเล่นในหน้าได้ · 360px ไม่ล้น
- **L9 / Lab 04 UI เสร็จ** (Claude · `2a3063e`): 3 หน้าเมนูไทย (`/interests` `/contact` → 301) · หน้าแรก headline/tagline/ประโยคสุ่ม/การ์ดเพลง · หน้าทักทาย (limit + microcopy + `textContent`) · ธีมขาว my-ci · `npm test` 29/29 · build ผ่าน · 360px ไม่ล้น · สัญญา API ตรวจโดย OpenCode → `docs/fe-be-contract-check.md`
- **L5 / Lab 02 เสร็จ** (2026-09-25): `docs/DEBATE.md` 3 มุม + `docs/DECISIONS.md` D1–D10 · human เลือก: 3 หน้าเมนูไทย · ตัดฟอร์ม Contact · rate limit IP ใน memory · เจ้าของลบข้อความเองภายใน 24 ชม. · PROFILE เพิ่ม `## Tagline`
- **L7 ปิด** (2026-09-25): ชาร์ตว่างเข้า backoff (OpenCode `f36b393`) · Claude ยืนยันว่า Astro โหลด page แบบ lazy จึงทำ boot warm-up ใน app ไม่ได้ · human เลือกยอมรับไปก่อน → แก้ตอน deploy (L8)
- Lab 01 เสร็จ: `docs/PROFILE.md` ครบโครง + `## Brainstorm`
- **L3 เพลงสุ่ม ฝั่ง server เสร็จ** (OpenCode · 2026-09-25): `src/lib/music.ts` — cache TTL 1 ชม. · stale-on-error · timeout 3s · validate `music.apple.com` URL · ไม่ throw (พัง = `null`) · `npm test` 15/15 + `npm run build` ผ่าน · สเปก/สัญญาใน `docs/handoffs/05-claude-to-opencode.md` · ส่งกลับที่ `docs/handoffs/05-opencode-to-claude.md`
- **L3 UI เสร็จ** (Claude): การ์ด "เพลงสุ่มวันนี้" ใน `src/pages/index.astro` · `null` = ซ่อนการ์ด · localhost ตอบ 200 และแสดงเพลงจริง
- **L4 เสร็จ** (Claude): ประโยคสุ่มใต้ headline หน้าแรก · `src/lib/tagline.ts` แม่แบบไทย 7 แบบ + Interests · ไม่พึ่งเน็ต · `npm test` 20/20
- **L2 เสร็จ** (Claude · `a1c7320`): parser อ่าน Bio ทุกย่อหน้า + Interests ทุกข้อ · มี `tests/profile.test.ts`
- **L6 เสร็จ** (OpenCode · 2026-09-25): หน้าแรกไม่รอ Apple — warm-up ตอน import · stale-while-revalidate · cold-start wait ≤1s (`WAIT_MS`) · single-flight · backoff 60s (`BACKOFF_MS`) · fetch timeout 8s · `__resetForTest()` สำหรับ test · วัดจริง dev server: `/` จาก 3045ms → **1067ms** แล้ว 214ms · การ์ดขึ้นจริง · `npm test` 25/25 + build ผ่าน · สเปก `docs/handoffs/05b-claude-to-opencode.md` · ส่งกลับ `docs/handoffs/05b-opencode-to-claude.md`
- **L7 ข้อ 2 เสร็จ** (OpenCode · 2026-09-25): ชาร์ตว่าง = failure → backoff 60s เหมือน error · ไม่ทับ cache เก่า · `npm test` **26/26** + build ผ่าน · **ข้อ 1 (boot warm-up) ทำไม่ได้ภายในขอบเขต → หยุดตามเงื่อนไข** — middleware lazy (พิสูจน์ด้วยโค้ด build + วัดจริง) · ไม่มี prod boot hook · `inlineDynamicImports` ถูก rolldown reject · รอ decision (หลักฐาน + ทางเลือกใน `docs/handoffs/05c-opencode-to-claude.md`)

## In progress

- L10 ส่ง OpenCode แล้ว → `docs/handoffs/04-claude-to-opencode.md`

## Blocked

- —

## Next actions

1. OpenCode: Lab 05 guestbook API (L10) — ถาม human เรื่อง `/api/contact` 404 vs 410 ก่อน
2. Human: review + merge PR Lab 04
3. Lab 08: HEALTHCHECK warm การ์ดเพลง (L8)

## Files changed in latest session

- `src/layouts/BaseLayout.astro` · `src/pages/{index,about,guestbook,interests,contact}.astro` · `src/styles/tokens.css` (ใหม่)
- `src/lib/profile.ts` (`tagline`) · `src/lib/tagline.ts` · `tests/profile.test.ts` · `tests/tagline.test.ts` · `.gitignore`
- `docs/fe-be-contract-check.md` (OpenCode) · `docs/handoffs/04-claude-to-opencode.md` · `docs/STATUS.md` · `docs/OPEN_LOOPS.md`

## Notes

- Proposed vs Approved: Apple Music RSS + ประโยคสุ่ม ยัง proposed ใน `DEBATE.md` — รอปิดเป็น D-id
- `## Brainstorm` ไม่ถูก render บนเว็บ (`profile.ts` ไม่อ่านหัวข้อนี้)