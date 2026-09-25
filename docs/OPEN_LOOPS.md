# Open Loops

> งานค้างที่ยังไม่ปิด · ลบแถวเมื่อเสร็จ  
> Owner = `Claude` | `OpenCode` | `human`

Last updated: 2026-09-25 13:51 +07:00

| ID | Task | Owner | Priority | Trigger / due | Notes |
|---|---|---|---|---|---|
| L8 | Warm-up หลัง deploy: เพิ่ม `HEALTHCHECK` ใน `Dockerfile` ยิง `/` ด้วย `node -e "fetch(...)"` (image อาจไม่มี curl) → คนแรกหลัง restart เห็นการ์ดเพลง · ไม่ใช้ webhook/secret | Claude | P2 | Lab 08 | human เลือกทางเลือก 1 (2026-09-25) · ที่มา `docs/handoffs/05c-opencode-to-claude.md` |
| L10 | Lab 05 backend: guestbook API ตาม D4/D5 + ชุดรหัส error ปิด (D9) + `/api/contact` ไม่รับข้อมูล (D3) + `docs/GUESTBOOK.md` | OpenCode | P1 | Lab 05 | สเปก `docs/handoffs/04-claude-to-opencode.md` · รายงานสัญญา `docs/fe-be-contract-check.md` · 404 vs 410 รอ human |

## ปิดแล้ว (ย่อ — ย้ายหรือลบได้เมื่อรก)

| ID | Task | Closed |
|---|---|---|
| L1 | สร้าง STATUS + OPEN_LOOPS จาก example | 2026-09-25 |
| L2 | แก้ regex `profile.ts` อ่าน section หลายบรรทัด + `tests/profile.test.ts` (commit `a1c7320`) | 2026-09-25 |
| L4 | ประโยคสุ่มหน้าแรก `src/lib/tagline.ts` (แม่แบบไทย + Interests) + `tests/tagline.test.ts` · ผูกใน `index.astro` | 2026-09-25 |
| L3 | `src/lib/music.ts` `getRandomSong()` — Apple Music RSS ชาร์ตไทย + cache TTL 1 ชม. + stale-on-error + timeout 3s · `npm test` + build ผ่าน · การ์ดบนหน้าแรกผูกแล้ว (Claude · `index.astro`) | 2026-09-25 |
| L6 | เพลงสุ่มไม่ทำให้หน้าแรกรอ + การ์ดขึ้นตั้งแต่คนแรก — warm-up · stale-while-revalidate · cold-start wait ≤1s · single-flight · backoff 60s · timeout 8s · `__resetForTest()` · 13 tests · วัดจริง `/` 3045ms → 1067ms (สเปก `05b-claude-to-opencode.md` · ส่งกลับ `05b-opencode-to-claude.md`) | 2026-09-25 |
| L7 | ชาร์ตว่าง → backoff 60s (OpenCode `f36b393`) · boot warm-up ทำไม่ได้ใน Astro (page/middleware โหลด lazy) → human เลือกยอมรับไปก่อน + ย้ายไป L8 (Lab 08) | 2026-09-25 |
| L5 | Lab 02: DEBATE 3 มุม → `DECISIONS.md` D1–D10 (human ตัดสิน 4 ข้อขัดแย้ง) | 2026-09-25 |
| L9 | Lab 04 UI ตาม DECISIONS D1–D9: 3 หน้าเมนูไทย + redirect · tagline · การ์ดเพลงมีป้ายที่มา · หน้าทักทาย · ธีมขาว my-ci · ตรวจสัญญา API กับ OpenCode (`2a3063e`) | 2026-09-25 |

## กฎสั้น

- อย่าเก็บงานที่ปิดแล้วจำนวนมากในตารางบน
- เปลี่ยน owner เมื่อ handoff ข้าม harness (ดู `docs/handoffs/`)
- สอง agent ห้ามเป็น writer พร้อมกันบนไฟล์นี้ — single-writer ตาม `AGENTS.md`
