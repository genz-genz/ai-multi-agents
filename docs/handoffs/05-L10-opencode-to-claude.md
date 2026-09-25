# Handoff: OpenCode → Claude

Timestamp: 2026-09-25 15:00 +07:00  
Task: L10 · Lab 05 backend เสร็จ — Guestbook API + ปิด `/api/contact`  
Status: DONE (รอ Claude รับงาน + human merge)

## What changed (branch `lab-05-backend` · ต่อจาก `lab-04-frontend`)

- **`src/lib/db.ts`** — implement จริงทั้ง 3 helper (better-sqlite3):
  - `insertGuestbook` / `parseGuestbookInput` — validate ฝั่ง server เป็นหลัก (D4): trim · ชื่อ ≤ 30 · ข้อความ ≤ 280 · ปฏิเสธลิงก์ทั้ง `name`+`message` (pattern ครอบ `http(s)://`, `www.`, โดเมนติดตัวอักษรบน TLD สามัญ เช่น `abc.com` — แคบกว่า "จุดอะไรก็ได้" เพื่อไม่ติดโผผมในภาษาไทย) · ไม่เก็บอีเมล/IP
  - `listGuestbook` — `ORDER BY id DESC` (ใหม่สุดก่อน · กัน `created_at` ซ้ำในวินาทีเดียว)
  - `insertContact` — implement จริงเพื่อสัญญา `tests/labs` เท่านั้น **ไม่มีผู้เรียกใน production** (D3)
  - error ใหม่: `ApiError` พร้อม `code` จากชุดปิด `INVALID_INPUT | INVALID_LINK | READONLY | RATE_LIMITED | GONE | SERVER_ERROR` (D9) — route map code → status ผ่านตารางเดียว ไม่ parse string
  - `created_at` = `new Date().toISOString()` (ISO 8601 UTC — ตามที่ตกลงใน `fe-be-contract-check.md` §4)
- **`src/pages/api/guestbook.ts`** — รหัส error ปิด + map status: `400 INVALID_INPUT · 400 INVALID_LINK · 403 READONLY · 429 RATE_LIMITED · 500 SERVER_ERROR` · **ลบ branch `NOT_IMPLEMENTED → 501` แล้ว** · rate limit 1 ข้อความ/นาที/IP: `Map<ip, timestamp>` ระดับ module · TTL 5 นาที (sweep) · นับเฉพาะโพสต์สำเร็จ · **validate ก่อน rate gate** (คนที่พิมพ์ลิงก์ผิดต้องเห็น `INVALID_LINK` ไม่ใช่ 429 — D9 "error ชัดก่อนขำ") · IP = `x-forwarded-for` (ตัวแรก) ก่อน `clientAddress` — ให้ถูกหลัง proxy (Coolify) · `GUESTBOOK_READONLY=1` → 403 ก่อน parse body (D5) · error ไม่รู้จัก → `console.error` ฝั่ง server เท่านั้น + `500 SERVER_ERROR` ไม่ leak stack/SQL/message (D9)
- **`src/pages/api/contact.ts`** — `POST` ตอบ **`410 { error: "GONE" }` ไม่ parse body เลย** · human เลือก 410 (2026-09-25 · ผ่านการถามตรงตามหมายเหตุ D3) — **ขอ Claude บันทึกเป็น D-id ถัดไป (D13) ใน `DECISIONS.md`** (ไฟล์เป็นของ Claude ผมไม่เขียน)
- **`docs/GUESTBOOK.md`** (ใหม่) — คู่มือลบข้อความด้วย sqlite + สวิตช์ READONLY สำหรับเจ้าของ (D5 · Req 6)

## Verification (ครบทั้งหมด)

- `npm run test:labs` — **2/2 PASS** (insertContact persists · guestbook roundtrip)
- `npm test` — **29/29 PASS** (ไม่ทำ regression ฝั่ง UI/profile/tagline/music)
- `npm run build` — PASS
- **Smoke ผ่าน HTTP จริง** (build standalone + `DATA_DIR` ชั่วคราว):

| คำขอ | ผล |
|---|---|
| `GET /api/guestbook` (ว่าง) | 200 `{"entries":[]}` |
| `POST` ถูกต้อง | 201 + entry (`created_at` เป็น ISO UTC) |
| `POST` ครั้งที่ 2 ในนาทีเดียว | 429 `RATE_LIMITED` |
| `POST` มีลิงก์ (ภายในหน้าต่าง rate) | 400 `INVALID_LINK` ← พิสูจน์ validate-ก่อน-gate |
| `POST` ชื่อว่าง / body พัง | 400 `INVALID_INPUT` |
| `POST /api/contact` | 410 `GONE` |
| `GUESTBOOK_READONLY=1` + `POST` | 403 `READONLY` · `GET` ยัง 200 |
| `GET` หลังโพสต์ | 200 แสดงรายการใหม่สุดก่อน |

## Ownership

- แตะเฉพาะไฟล์ backend ตาม handoff เดิม: `src/lib/db.ts` · `src/pages/api/guestbook.ts` · `src/pages/api/contact.ts` + เอกสารของตน — **ไม่แตะ `src/pages/*.astro` / layouts / styles / `profile.ts` / `tagline.ts` / `.env`**
- UI ไม่ต้องแก้ anything — สัญญาตรงตามที่ฟอร์มผูกไว้ (รหัส error ทุกตัวมี microcopy รองรับแล้ว)

## Assumptions to challenge

1. Rate limit ใน memory พอ (1 container) — ถ้า scale หลาย instance นับแยกกัน (ยอมรับไว้แล้วตั้งแต่ handoff Lab 04)
2. `x-forwarded-for` ตัวแรกคือ client จริง — Coolify proxy ตั้ง header นี้อยู่แล้ว ถ้า topology เปลี่ยนต้องทบทวน
3. TLD list ใน `LINK_PATTERN` ยังไม่ครบทุก TLD — เป็นการกัน "พื้นฐาน" ตามตัวอักษร D4 ไม่ใช่ระบบ anti-spam เต็มรูป

## Request to next agent (Claude)

1. **บันทึก D13** — "`POST /api/contact` ตอบ 410 GONE ไม่ประมวลผล body (D3) · ตัดสินโดย human 2026-09-25" ลง `docs/DECISIONS.md`
2. รับงานต่อ: Lab 06 QA — ตอนนี้ API เป็นของจริงแล้ว e2e จะยิงได้เต็มรูปแบบ (รวม 429/403 ถ้าตั้ง env)
3. ถ้าจะรันจริง: `npm run dev` (หรือ `npm run build && npm start`) — ตาราง SQLite สร้างเองใน `getDb()` ครั้งแรก

## Canonical state updated

- [x] `docs/STATUS.md`
- [x] `docs/OPEN_LOOPS.md` (L10 ย้ายไปปิดแล้ว)
- [ ] `docs/DECISIONS.md` — รอ Claude บันทึก D13 (410 GONE)
- [x] อื่น ๆ: `docs/GUESTBOOK.md` (ใหม่)

## Single-writer note

Writer รอบถัดไปของ STATUS/OPEN_LOOPS = Claude (หลังรับ handoff นี้)
