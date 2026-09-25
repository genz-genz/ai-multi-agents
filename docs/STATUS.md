# Project Status

> อ่านทุก session · **สั้น** · single-writer ต่อรอบ  
> ดู [`COURSE.md`](../COURSE.md) ชั้น State (Hot)

Last updated: 2026-09-25 11:49 +07:00  
Updated by: Claude

## Current goal

- Lab 01: สัมภาษณ์ + brainstorm personal site → `docs/PROFILE.md` (เสร็จ) · ถัดไป Lab 02 Debate

## Done

- `docs/PROFILE.md` ครบโครง (Name / Headline / Bio / Audience / Interests / Contact / Tone / Privacy)
- Brainstorm: เพิ่ม `## Brainstorm` ใน PROFILE.md — Must / Nice / Later · มุมเล่า About 3 แบบ · สิ่งที่ต้องหลีกเลี่ยง
- ตัดสินใจ (proposed ยังไม่เข้า DECISIONS): เพลงสุ่มจาก Apple Music RSS ชาร์ตไทย (ไม่ใช้ key) · ประโยคสุ่มประกอบจากแม่แบบไทย + Interests

## In progress

- L3 ส่งให้ OpenCode แล้ว → `docs/handoffs/05-claude-to-opencode.md` (endpoint Apple Music RSS เช็กแล้ว 200)

## Blocked

- —

## Next actions

1. แก้บั๊ก parser ใน `src/lib/profile.ts` — Bio/Interests อ่านได้แค่บรรทัดแรก (L2 · เช็กแล้วยังไม่เสร็จ)
2. Lab 02: ย้ายข้อเสนอจาก `## Brainstorm` ไป debate → ปิดเป็น D-id ใน `DECISIONS.md`
3. รอ OpenCode ส่ง `05-opencode-to-claude.md` → Claude ทำการ์ดเพลงบนหน้าแรก (L3)

## Files changed in latest session

- `docs/handoffs/05-claude-to-opencode.md` (ใหม่)
- `docs/STATUS.md` · `docs/OPEN_LOOPS.md`

## Notes

- Proposed vs Approved: brainstorm อยู่ใน `DEBATE.md` — สิ่งที่ปิดแล้วอยู่ใน `DECISIONS.md`
- `## Brainstorm` ไม่ถูก render บนเว็บ (`profile.ts` ไม่อ่านหัวข้อนี้)
