# Project Status

> อ่านทุก session · **สั้น** · single-writer ต่อรอบ  
> ดู [`COURSE.md`](../COURSE.md) ชั้น State (Hot)

Last updated: 2026-09-25 13:45 +07:00  
Updated by: Claude

## Current goal

- Lab 02 เสร็จ (`DECISIONS.md` D1–D10) → ถัดไป Lab 03 วางแผน issues / Lab 04 frontend ตาม DECISIONS

## Done

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

- —

## Blocked

- —

## Next actions

1. Lab 04 frontend ตามเกณฑ์ใน `DECISIONS.md` (L9 · Claude)
2. เขียน handoff Lab 05 ให้ OpenCode ตาม D3–D5 (L10)
3. Lab 08: HEALTHCHECK warm การ์ดเพลง (L8)

## Files changed in latest session

- `docs/DEBATE.md` (commit ครั้งแรก) · `docs/DECISIONS.md` (ใหม่)
- `docs/PROFILE.md` (`## Tagline`)
- `docs/STATUS.md` · `docs/OPEN_LOOPS.md`

## Notes

- Proposed vs Approved: Apple Music RSS + ประโยคสุ่ม ยัง proposed ใน `DEBATE.md` — รอปิดเป็น D-id
- `## Brainstorm` ไม่ถูก render บนเว็บ (`profile.ts` ไม่อ่านหัวข้อนี้)