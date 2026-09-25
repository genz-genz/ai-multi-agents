# Project Status

> อ่านทุก session · **สั้น** · single-writer ต่อรอบ  
> ดู [`COURSE.md`](../COURSE.md) ชั้น State (Hot)

Last updated: 2026-09-25 12:00 +07:00  
Updated by: OpenCode

## Current goal

- Lab 02: ย้ายข้อเสนอจาก `## Brainstorm` เข้า debate → ปิดเป็น D-id ใน `DECISIONS.md` (ฝั่ง Claude) · L3 backend ปิดแล้ว

## Done

- Lab 01 เสร็จ: `docs/PROFILE.md` ครบโครง + `## Brainstorm`
- **L3 เพลงสุ่ม ฝั่ง server เสร็จ** (OpenCode · 2026-09-25): `src/lib/music.ts` — cache TTL 1 ชม. · stale-on-error · timeout 3s · validate `music.apple.com` URL · ไม่ throw (พัง = `null`) · `npm test` 15/15 + `npm run build` ผ่าน · สเปก/สัญญาใน `docs/handoffs/05-claude-to-opencode.md` · ส่งกลับที่ `docs/handoffs/05-opencode-to-claude.md`

## In progress

- —

## Blocked

- —

## Next actions

1. แก้บั๊ก parser ใน `src/lib/profile.ts` — Bio/Interests อ่านได้แค่บรรทัดแรก (L2 · เช็กแล้วยังไม่เสร็จ · ของ Claude)
2. Lab 02: ย้ายข้อเสนอจาก `## Brainstorm` ไป debate → ปิดเป็น D-id ใน `DECISIONS.md` (L5)
3. Claude ผูกการ์ดเพลงสุ่มบนหน้าแรก — เรียก `getRandomSong()` จาก frontmatter · `null` = ซ่อนการ์ด (ดู `docs/handoffs/05-opencode-to-claude.md`)

## Files changed in latest session

- `src/lib/music.ts` (ใหม่) · `tests/music.test.ts` (ใหม่)
- `docs/handoffs/05-opencode-to-claude.md` (ใหม่)
- `docs/STATUS.md` · `docs/OPEN_LOOPS.md`

## Notes

- Proposed vs Approved: Apple Music RSS + ประโยคสุ่ม ยัง proposed ใน `DEBATE.md` — รอปิดเป็น D-id
- `## Brainstorm` ไม่ถูก render บนเว็บ (`profile.ts` ไม่อ่านหัวข้อนี้)