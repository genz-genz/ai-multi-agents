# Project Status

> อ่านทุก session · **สั้น** · single-writer ต่อรอบ  
> ดู [`COURSE.md`](../COURSE.md) ชั้น State (Hot)

Last updated: 2026-09-25 12:20 +07:00  
Updated by: OpenCode

## Current goal

- Lab 02: ย้ายข้อเสนอจาก `## Brainstorm` เข้า debate → ปิดเป็น D-id ใน `DECISIONS.md` (ฝั่ง Claude) · L2 + L3 + L4 + L6 ปิดแล้ว

## Done

- Lab 01 เสร็จ: `docs/PROFILE.md` ครบโครง + `## Brainstorm`
- **L3 เพลงสุ่ม ฝั่ง server เสร็จ** (OpenCode · 2026-09-25): `src/lib/music.ts` — cache TTL 1 ชม. · stale-on-error · timeout 3s · validate `music.apple.com` URL · ไม่ throw (พัง = `null`) · `npm test` 15/15 + `npm run build` ผ่าน · สเปก/สัญญาใน `docs/handoffs/05-claude-to-opencode.md` · ส่งกลับที่ `docs/handoffs/05-opencode-to-claude.md`
- **L3 UI เสร็จ** (Claude): การ์ด "เพลงสุ่มวันนี้" ใน `src/pages/index.astro` · `null` = ซ่อนการ์ด · localhost ตอบ 200 และแสดงเพลงจริง
- **L4 เสร็จ** (Claude): ประโยคสุ่มใต้ headline หน้าแรก · `src/lib/tagline.ts` แม่แบบไทย 7 แบบ + Interests · ไม่พึ่งเน็ต · `npm test` 20/20
- **L2 เสร็จ** (Claude · `a1c7320`): parser อ่าน Bio ทุกย่อหน้า + Interests ทุกข้อ · มี `tests/profile.test.ts`
- **L6 เสร็จ** (OpenCode · 2026-09-25): หน้าแรกไม่รอ Apple — warm-up ตอน import · stale-while-revalidate · cold-start wait ≤1s (`WAIT_MS`) · single-flight · backoff 60s (`BACKOFF_MS`) · fetch timeout 8s · `__resetForTest()` สำหรับ test · วัดจริง dev server: `/` จาก 3045ms → **1067ms** แล้ว 214ms · การ์ดขึ้นจริง · `npm test` 25/25 + build ผ่าน · สเปก `docs/handoffs/05b-claude-to-opencode.md` · ส่งกลับ `docs/handoffs/05b-opencode-to-claude.md`

## In progress

- —

## Blocked

- —

## Next actions

1. Lab 02: ย้ายข้อเสนอจาก `## Brainstorm` ไป debate → ปิดเป็น D-id ใน `DECISIONS.md` (L5 · ฝั่ง Claude)

## Files changed in latest session

- `src/lib/music.ts` (L6: warm-up · stale-while-revalidate · cold-start wait ≤1s · single-flight · backoff 60s · fetch timeout 8s)
- `tests/music.test.ts` (ขยาย 8 → 13 tests)
- `docs/handoffs/05b-opencode-to-claude.md` (ใหม่)
- `docs/STATUS.md` · `docs/OPEN_LOOPS.md`

## Notes

- Proposed vs Approved: Apple Music RSS + ประโยคสุ่ม ยัง proposed ใน `DEBATE.md` — รอปิดเป็น D-id
- `## Brainstorm` ไม่ถูก render บนเว็บ (`profile.ts` ไม่อ่านหัวข้อนี้)