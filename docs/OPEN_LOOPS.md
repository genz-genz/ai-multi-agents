# Open Loops

> งานค้างที่ยังไม่ปิด · ลบแถวเมื่อเสร็จ  
> Owner = `Claude` | `OpenCode` | `human`

Last updated: 2026-09-25 12:20 +07:00

| ID | Task | Owner | Priority | Trigger / due | Notes |
|---|---|---|---|---|---|
| L7 | เพลงสุ่ม: warm-up ตอน server boot จริง (ตอนนี้เริ่มที่ request แรก → คนแรกหลัง restart ไม่เห็นการ์ด) + ชาร์ตว่างต้องเข้า backoff | OpenCode | P2 | ตอนนี้ | สเปก `docs/handoffs/05c-claude-to-opencode.md` · Claude วัด build จริง req1 1.25s card=no |
| L5 | ย้ายข้อเสนอใน `## Brainstorm` เข้า debate → `DECISIONS.md` | Claude | P1 | Lab 02 | ตอนนี้ยังเป็น proposed |

## ปิดแล้ว (ย่อ — ย้ายหรือลบได้เมื่อรก)

| ID | Task | Closed |
|---|---|---|
| L1 | สร้าง STATUS + OPEN_LOOPS จาก example | 2026-09-25 |
| L2 | แก้ regex `profile.ts` อ่าน section หลายบรรทัด + `tests/profile.test.ts` (commit `a1c7320`) | 2026-09-25 |
| L4 | ประโยคสุ่มหน้าแรก `src/lib/tagline.ts` (แม่แบบไทย + Interests) + `tests/tagline.test.ts` · ผูกใน `index.astro` | 2026-09-25 |
| L3 | `src/lib/music.ts` `getRandomSong()` — Apple Music RSS ชาร์ตไทย + cache TTL 1 ชม. + stale-on-error + timeout 3s · `npm test` + build ผ่าน · การ์ดบนหน้าแรกผูกแล้ว (Claude · `index.astro`) | 2026-09-25 |
| L6 | เพลงสุ่มไม่ทำให้หน้าแรกรอ + การ์ดขึ้นตั้งแต่คนแรก — warm-up · stale-while-revalidate · cold-start wait ≤1s · single-flight · backoff 60s · timeout 8s · `__resetForTest()` · 13 tests · วัดจริง `/` 3045ms → 1067ms (สเปก `05b-claude-to-opencode.md` · ส่งกลับ `05b-opencode-to-claude.md`) | 2026-09-25 |

## กฎสั้น

- อย่าเก็บงานที่ปิดแล้วจำนวนมากในตารางบน
- เปลี่ยน owner เมื่อ handoff ข้าม harness (ดู `docs/handoffs/`)
- สอง agent ห้ามเป็น writer พร้อมกันบนไฟล์นี้ — single-writer ตาม `AGENTS.md`
