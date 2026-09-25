# Handoff: Claude → OpenCode

Timestamp: 2026-09-25 13:51 +07:00  
Task: Lab 04 frontend เสร็จ → Lab 05 backend: Guestbook API + ปิด Contact ตาม `docs/DECISIONS.md` (OPEN_LOOPS L10)  
Status: NEEDS_REVIEW (UI เสร็จ · API ยังเป็น stub)

## What changed

- UI ตาม DECISIONS D1–D9 (commit `2a3063e` บน branch `lab-04-frontend`)
  - เมนู 3 หน้าไทย: หน้าแรก `/` · รู้จักกัน `/about` · ทักทาย `/guestbook` · `/interests` → 301 `/about` · `/contact` → 301 `/guestbook` (D2, D3)
  - หน้าแรก: headline → tagline คงที่ (`## Tagline` ใหม่ใน PROFILE) → ประโยคสุ่ม → การ์ดเพลง + ป้าย "จากชาร์ตไทย Apple Music" (D1, D6)
  - หน้าทักทาย: ฟอร์มชื่อเล่น ≤ 30 / ข้อความ ≤ 280 + ตัวนับ · กติกาแสดงก่อนพิมพ์ · microcopy ไทย · render คำทักด้วย `textContent` เท่านั้น (D4, D9)
  - ธีมขาวจาก my-ci tokens `src/styles/tokens.css` (D8) · ไม่มีฟอร์ม Contact (D3)
- สัญญา API ตรวจแล้วโดย OpenCode → **`docs/fe-be-contract-check.md`** (call ข้าม harness ครั้งเดียว · รูปทรงหลัก match · mismatch ทั้งหมดอยู่ฝั่ง backend · UI ไม่ต้องแก้)

## Files

- แก้ได้ (owner OpenCode): `src/lib/db.ts` · `src/pages/api/guestbook.ts` · `src/pages/api/contact.ts` · test ของ backend
- **ห้ามแตะ:** `src/pages/*.astro` · `src/layouts/` · `src/styles/` · `src/lib/profile.ts` · `src/lib/tagline.ts` · `src/lib/music.ts` (ไม่เกี่ยว) · `.env`

## สัญญาที่ UI ใช้อยู่แล้ว (`src/pages/guestbook.astro`)

| Request | Response ที่ UI คาด |
|---|---|
| `GET /api/guestbook` | `200 { entries: [{ id, name, message, created_at }] }` ใหม่สุดก่อน · สถานะอื่น = UI แสดง "ยังโหลดคำทักไม่ได้" |
| `POST /api/guestbook` `{ name, message }` | `201` + entry |
| ว่าง / ชื่อ > 30 / ข้อความ > 280 / body พัง | `400 { error: "INVALID_INPUT" }` |
| มีลิงก์ (ใน `name` **หรือ** `message`) | `400 { error: "INVALID_LINK" }` |
| เกิน 1 ข้อความ/นาที/IP | `429 { error: "RATE_LIMITED" }` |
| `GUESTBOOK_READONLY=1` | `403 { error: "READONLY" }` |
| อื่น ๆ | `500 { error: "SERVER_ERROR" }` — UI แสดง "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง" |

## ตอบคำถามใน `fe-be-contract-check.md` §4

1. **`created_at` = ISO 8601 UTC** (`toISOString()`) — ตกลง · UI ใช้ `new Date(value)` + `toLocaleDateString('th-TH')` · parse ไม่ได้ = ซ่อนวันที่ (ไม่พัง)
2. **เช็กลิงก์ทั้ง `name` และ `message`** — ตกลง ตรงกับ UI · pattern ฝั่ง server ครอบกว่า UI ได้ (เช่นโดเมนติดตัวอักษร `abc.com`) — UI เช็กแค่ `https?://` / `www.` เป็นการเตือนล่วงหน้า
3. **ไม่ต้องใส่ `Retry-After`** — UI แสดงข้อความคงที่ ไม่ทำ countdown ใน v1

## Requirements (Lab 05)

1. Implement `listGuestbook` / `insertGuestbook` ตาม D4: trim + validate ฝั่ง server เป็นหลัก · `ORDER BY id DESC` · ไม่เก็บอีเมล/IP ลง DB
2. Rate limit 1 ข้อความ/นาที/IP — IP ใน memory ของ process เท่านั้น (หมดอายุไม่กี่นาที · ห้ามลง DB/log) · อ่าน IP ให้ถูกหลัง proxy (ดู §1 ข้อ 8 ในรายงาน)
3. `GUESTBOOK_READONLY=1` → 403 `READONLY` (D5)
4. **ชุดรหัส error ปิด** + map code → status ตารางเดียว · ห้ามส่ง `err.message` / stack / SQL ออกไป (D9 · public-site-safe) · เอา branch `NOT_IMPLEMENTED → 501` ออกเมื่อ implement เสร็จ
5. **หมายเหตุ D3:** implement `insertContact` ให้ `tests/labs` เขียว แต่ `POST /api/contact` ต้องไม่ประมวลผล body — ข้อเสนอของ OpenCode = `410 { error: "GONE" }` · **human ยังไม่ได้ตัดสิน 404 vs 410** → ถามก่อน implement ข้อนี้
6. คู่มือลบข้อความ guestbook ด้วย sqlite (D5) — เขียนเป็น `docs/GUESTBOOK.md` (เจ้าของใช้ · ไม่ใช่หน้าเว็บ)
7. `npm test` + `npm run test:labs` + `npm run build` ต้องเขียว

## Verification (ฝั่ง frontend รอบนี้)

- Unit / smoke: **PASS** — `npm test` 29/29 (รวม test ประโยคสุ่มทุกคอมบิเนชัน D7 + `## Tagline`)
- Labs (`npm run test:labs`): **FAIL ตามคาด** — API ยังเป็น stub (งาน Lab 05)
- Build: **PASS**
- Localhost (build จริง): `/` `/about` `/guestbook` = 200 · `/interests` `/contact` = 301 · `/nope` = 404 · ไม่มี `demo@example.com` / `/api/` / `POST` / ช่อง `—` ใน HTML ที่ render · `POST /api/guestbook` = 501 (stub)
- Mobile 360px (Playwright): ไม่มีข้อความล้นขอบ ทั้ง 3 หน้า · `scrollWidth` ไม่เกิน viewport

## Assumptions to challenge

1. เก็บ rate limit ใน memory ของ process เดียวพอ (เว็บรัน 1 container) — ถ้า scale หลาย instance จะนับแยกกัน
2. `SERVER_ERROR` ใช้แทนทุก error ที่ไม่รู้จัก — UI ไม่ต้องแยก 500 กับ 501

## Request to next agent

- **Implement** Requirements 1–7 ในไฟล์ owner ของ backend เท่านั้น · ข้อ 5 ถาม human ก่อน (404 vs 410)
- ปิด L10 ใน `docs/OPEN_LOOPS.md` · อัปเดต `docs/STATUS.md`
- เขียน `docs/handoffs/05-L10-opencode-to-claude.md` แล้ว commit (Claude จะรัน `claude -p` ตรวจ integration ตาม Lab 05)

## Canonical state updated

- [x] `docs/STATUS.md`
- [x] `docs/OPEN_LOOPS.md`
- [ ] `docs/DECISIONS.md` (ยังไม่มี decision ใหม่ — 404 vs 410 รอ human)
- [x] อื่น ๆ: `docs/fe-be-contract-check.md` (รายงานจาก OpenCode)

## Single-writer note

Writer รอบถัดไปของ STATUS/OPEN_LOOPS = OpenCode (จนกว่าจะส่ง handoff กลับ)
