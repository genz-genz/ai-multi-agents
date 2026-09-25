# Open Loops

> งานค้างที่ยังไม่ปิด · ลบแถวเมื่อเสร็จ  
> Owner = `Claude` | `OpenCode` | `human`

Last updated: 2026-09-25 15:55 +07:00

| ID | Task | Owner | Priority | Trigger / due | Notes |
|---|---|---|---|---|---|
| L13 | e2e เคส XSS seed ด้วย XFF ปลอม → L12 ปิดแล้ว วิธี seed เดิมใช้ไม่ได้ · หาวิธี seed ใหม่ (SWARM G5) | Claude | P3 | Lab 06 | `playwright/guestbook.spec.ts` · L12 ปิดแล้ว (2026-09-25) seed ผ่าน XFF ปลอมไม่ได้อีก |
| L14 | `stash@{0}` = งาน OpenCode บน `main` (db.ts อีกชุด · SWARM/STATUS/OPEN_LOOPS · `opencode.json`) — ทิ้งหรือดึงบางไฟล์กลับ | human | P2 | ก่อน merge | SWARM G4 |
| L8 | Warm-up หลัง deploy: เพิ่ม `HEALTHCHECK` ใน `Dockerfile` ยิง `/` ด้วย `node -e "fetch(...)"` (image อาจไม่มี curl) → คนแรกหลัง restart เห็นการ์ดเพลง · ไม่ใช้ webhook/secret | Claude | P3 | Lab 08 | human เลือกทางเลือก 1 (2026-09-25) · ที่มา `docs/handoffs/05c-opencode-to-claude.md` · **D12: หน้าแรกไม่ใช้ชาร์ตแล้ว → อาจไม่ต้องทำ (ปิดพร้อม L11)** |
| L11 | `src/lib/music.ts` + `tests/music.test.ts` ไม่มีหน้าไหนเรียกแล้วหลัง D12 → เก็บไว้เผื่อใช้ หรือลบ (ถ้าลบ L8 ปิดได้เลย) | human → OpenCode | P3 | ก่อน Lab 08 | ไฟล์เป็นของ OpenCode · Claude ไม่ลบเอง |

## ปิดแล้ว (ย่อ — ย้ายหรือลบได้เมื่อรก)

| ID | Task | Closed |
|---|---|---|
| L12 | Rate limit ข้ามด้วย XFF ปลอม + เพดาน body — `clientIp()` เชื่อ XFF ตัวท้ายสุดเฉพาะ `TRUST_PROXY=1` (ตั้งใน Coolify env ตอน Lab 08 · ไม่ใส่ Dockerfile) · body ≤ 10KB → 400 INVALID_INPUT · `tests/guestbook-ip.test.ts` 4 เคส (RED→GREEN) · `npm test` 33/33 · test:labs 2/2 · build ผ่าน · handoff `05d-opencode-to-claude.md` | 2026-09-25 |
| L1 | สร้าง STATUS + OPEN_LOOPS จาก example | 2026-09-25 |
| L2 | แก้ regex `profile.ts` อ่าน section หลายบรรทัด + `tests/profile.test.ts` (commit `a1c7320`) | 2026-09-25 |
| L4 | ประโยคสุ่มหน้าแรก `src/lib/tagline.ts` (แม่แบบไทย + Interests) + `tests/tagline.test.ts` · ผูกใน `index.astro` | 2026-09-25 |
| L3 | `src/lib/music.ts` `getRandomSong()` — Apple Music RSS ชาร์ตไทย + cache TTL 1 ชม. + stale-on-error + timeout 3s · `npm test` + build ผ่าน · การ์ดบนหน้าแรกผูกแล้ว (Claude · `index.astro`) | 2026-09-25 |
| L6 | เพลงสุ่มไม่ทำให้หน้าแรกรอ + การ์ดขึ้นตั้งแต่คนแรก — warm-up · stale-while-revalidate · cold-start wait ≤1s · single-flight · backoff 60s · timeout 8s · `__resetForTest()` · 13 tests · วัดจริง `/` 3045ms → 1067ms (สเปก `05b-claude-to-opencode.md` · ส่งกลับ `05b-opencode-to-claude.md`) | 2026-09-25 |
| L7 | ชาร์ตว่าง → backoff 60s (OpenCode `f36b393`) · boot warm-up ทำไม่ได้ใน Astro (page/middleware โหลด lazy) → human เลือกยอมรับไปก่อน + ย้ายไป L8 (Lab 08) | 2026-09-25 |
| L5 | Lab 02: DEBATE 3 มุม → `DECISIONS.md` D1–D10 (human ตัดสิน 4 ข้อขัดแย้ง) | 2026-09-25 |
| L9 | Lab 04 UI ตาม DECISIONS D1–D9: 3 หน้าเมนูไทย + redirect · tagline · การ์ดเพลงมีป้ายที่มา · หน้าทักทาย · ธีมขาว my-ci · ตรวจสัญญา API กับ OpenCode (`2a3063e`) | 2026-09-25 |
| L10 | Lab 05 backend: `db.ts` implement จริง (validate D4 · `ApiError` รหัสปิด D9 · `created_at` ISO UTC) · guestbook route (400/403/429/500 · rate limit 1/นาที/IP ใน memory · `GUESTBOOK_READONLY` → 403) · `/api/contact` = **410 GONE ไม่ parse body** (human เลือก 410) · `docs/GUESTBOOK.md` · `test:labs` 2/2 · `npm test` 29/29 · build · smoke HTTP ครบ → handoff `05-L10-opencode-to-claude.md` | 2026-09-25 |

## กฎสั้น

- อย่าเก็บงานที่ปิดแล้วจำนวนมากในตารางบน
- เปลี่ยน owner เมื่อ handoff ข้าม harness (ดู `docs/handoffs/`)
- สอง agent ห้ามเป็น writer พร้อมกันบนไฟล์นี้ — single-writer ตาม `AGENTS.md`
