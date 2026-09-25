# Open Loops

> งานค้างที่ยังไม่ปิด · ลบแถวเมื่อเสร็จ  
> Owner = `Claude` | `OpenCode` | `human`

Last updated: 2026-09-25 12:00 +07:00

| ID | Task | Owner | Priority | Trigger / due | Notes |
|---|---|---|---|---|---|
| L6 | `getRandomSong()` ทำให้หน้าแรกรอ + การ์ดหายตอน cold start (dev log `/` 3024–3045ms ชน timeout 3s) → warm-up · stale-while-revalidate · รอ ≤1s เมื่อไม่มี cache · single-flight · backoff | OpenCode | P1 | ตอนนี้ | สเปก `docs/handoffs/05b-claude-to-opencode.md` · ผู้ใช้เจอการ์ดไม่ขึ้นจริง |
| L5 | ย้ายข้อเสนอใน `## Brainstorm` เข้า debate → `DECISIONS.md` | Claude | P1 | Lab 02 | ตอนนี้ยังเป็น proposed |

## ปิดแล้ว (ย่อ — ย้ายหรือลบได้เมื่อรก)

| ID | Task | Closed |
|---|---|---|
| L1 | สร้าง STATUS + OPEN_LOOPS จาก example | 2026-09-25 |
| L2 | แก้ regex `profile.ts` อ่าน section หลายบรรทัด + `tests/profile.test.ts` (commit `a1c7320`) | 2026-09-25 |
| L4 | ประโยคสุ่มหน้าแรก `src/lib/tagline.ts` (แม่แบบไทย + Interests) + `tests/tagline.test.ts` · ผูกใน `index.astro` | 2026-09-25 |
| L3 | `src/lib/music.ts` `getRandomSong()` — Apple Music RSS ชาร์ตไทย + cache TTL 1 ชม. + stale-on-error + timeout 3s · `npm test` + build ผ่าน · การ์ดบนหน้าแรกผูกแล้ว (Claude · `index.astro`) | 2026-09-25 |

## กฎสั้น

- อย่าเก็บงานที่ปิดแล้วจำนวนมากในตารางบน
- เปลี่ยน owner เมื่อ handoff ข้าม harness (ดู `docs/handoffs/`)
- สอง agent ห้ามเป็น writer พร้อมกันบนไฟล์นี้ — single-writer ตาม `AGENTS.md`
