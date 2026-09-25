# Open Loops

> งานค้างที่ยังไม่ปิด · ลบแถวเมื่อเสร็จ  
> Owner = `Claude` | `OpenCode` | `human`

Last updated: 2026-09-25 10:34 +07:00

| ID | Task | Owner | Priority | Trigger / due | Notes |
|---|---|---|---|---|---|
| L2 | แก้ regex ใน `src/lib/profile.ts` ให้อ่าน section หลายบรรทัด (Bio ทุกย่อหน้า · Interests ทุกข้อ) | Claude | P0 | ก่อน Lab 04 | `(?=^##\s\|$)` + flag `m` → `$` จบที่ท้ายบรรทัดแรก · ต้องมี test |
| L3 | การ์ด "เพลงสุ่มวันนี้": ดึง Apple Music RSS ชาร์ตไทย ฝั่ง server + cache + fallback ซ่อนการ์ด | OpenCode | P1 | Lab 05 | เช็ก endpoint ก่อน implement · ไม่ใช้ key · ต้องมี handoff จาก Claude |
| L4 | ประโยคสุ่มหน้าแรก: แม่แบบประโยคไทย + คำจาก Interests | Claude | P1 | Lab 04 | ขึ้นกับ L2 · ไม่พึ่งเน็ต |
| L5 | ย้ายข้อเสนอใน `## Brainstorm` เข้า debate → `DECISIONS.md` | Claude | P1 | Lab 02 | ตอนนี้ยังเป็น proposed |

## ปิดแล้ว (ย่อ — ย้ายหรือลบได้เมื่อรก)

| ID | Task | Closed |
|---|---|---|
| L1 | สร้าง STATUS + OPEN_LOOPS จาก example | 2026-09-25 |

## กฎสั้น

- อย่าเก็บงานที่ปิดแล้วจำนวนมากในตารางบน
- เปลี่ยน owner เมื่อ handoff ข้าม harness (ดู `docs/handoffs/`)
- สอง agent ห้ามเป็น writer พร้อมกันบนไฟล์นี้ — single-writer ตาม `AGENTS.md`
