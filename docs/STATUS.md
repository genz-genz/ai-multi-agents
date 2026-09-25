# Project Status

> อ่านทุก session · **สั้น** · single-writer ต่อรอบ  
> ดู [`COURSE.md`](../COURSE.md) ชั้น State (Hot)

Last updated: 2026-09-25 12:20 +07:00  
Updated by: Claude

## Current goal

- Lab 02: ย้ายข้อเสนอจาก `## Brainstorm` เข้า debate → ปิดเป็น D-id ใน `DECISIONS.md` (ฝั่ง Claude) · L2 + L3 + L4 ปิดแล้ว

## Done

- Lab 01 เสร็จ: `docs/PROFILE.md` ครบโครง + `## Brainstorm`
- **L3 เพลงสุ่ม ฝั่ง server เสร็จ** (OpenCode · 2026-09-25): `src/lib/music.ts` — cache TTL 1 ชม. · stale-on-error · timeout 3s · validate `music.apple.com` URL · ไม่ throw (พัง = `null`) · `npm test` 15/15 + `npm run build` ผ่าน · สเปก/สัญญาใน `docs/handoffs/05-claude-to-opencode.md` · ส่งกลับที่ `docs/handoffs/05-opencode-to-claude.md`
- **L3 UI เสร็จ** (Claude): การ์ด "เพลงสุ่มวันนี้" ใน `src/pages/index.astro` · `null` = ซ่อนการ์ด · localhost ตอบ 200 และแสดงเพลงจริง
- **L4 เสร็จ** (Claude): ประโยคสุ่มใต้ headline หน้าแรก · `src/lib/tagline.ts` แม่แบบไทย 7 แบบ + Interests · ไม่พึ่งเน็ต · `npm test` 20/20
- **L2 เสร็จ** (Claude · `a1c7320`): parser อ่าน Bio ทุกย่อหน้า + Interests ทุกข้อ · มี `tests/profile.test.ts`

## In progress

- L6 ส่ง OpenCode แล้ว → `docs/handoffs/05b-claude-to-opencode.md` (การ์ดเพลงหายตอน cold start)

## Blocked

- —

## Next actions

1. Lab 02: ย้ายข้อเสนอจาก `## Brainstorm` ไป debate → ปิดเป็น D-id ใน `DECISIONS.md` (L5)
2. OpenCode: L6 — หน้าแรกไม่รอ Apple + การ์ดขึ้นตั้งแต่คนแรก (P1)

## Files changed in latest session

- `src/pages/index.astro` (การ์ดเพลงสุ่ม · ประโยคสุ่ม)
- `src/lib/tagline.ts` · `tests/tagline.test.ts` (L4)
- `src/lib/profile.ts` · `tests/profile.test.ts` (L2)
- `docs/STATUS.md` · `docs/OPEN_LOOPS.md`

## Notes

- Proposed vs Approved: Apple Music RSS + ประโยคสุ่ม ยัง proposed ใน `DEBATE.md` — รอปิดเป็น D-id
- `## Brainstorm` ไม่ถูก render บนเว็บ (`profile.ts` ไม่อ่านหัวข้อนี้)