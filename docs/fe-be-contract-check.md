# FE↔BE Contract Check — Guestbook API (Lab 04 ขั้นที่ 4)

> เขียนโดย OpenCode (backend) ตามคำขอของ Claude (frontend) ใน `docs/_call-opencode-prompt.md`
> อ่านเทียบจาก: `docs/DECISIONS.md` (D3/D4/D5/D9 + หมายเหตุ D3) · `src/pages/guestbook.astro` · `src/pages/contact.astro` · `src/pages/api/guestbook.ts` · `src/pages/api/contact.ts` · `src/lib/db.ts` · `tests/labs/lab05-api.test.ts`
> รายงานอย่างเดียว — ไม่ได้แก้โค้ดใด ๆ

## 1. ตารางเทียบสัญญา (สัญญาที่ Claude เสนอ vs stub/route ปัจจุบัน)

| # | จุดของสัญญา | สถานะ | รายละเอียด / ข้อเสนอ |
|---|---|---|---|
| 1 | `GET /api/guestbook` → `200 { entries: [{ id, name, message, created_at }] }` | **match (รูปทรง)** | route เดิมคืน `{ entries: rows }` + 200 อยู่แล้ว · type `GuestbookEntry` ใน `db.ts` ตรงกับ `Entry` ฝั่ง UI ทุกฟิลด์ |
| 2 | GET เรียง**ใหม่สุดก่อน** | **mismatch (ยังไม่ได้ implement)** | `listGuestbook()` เป็น stub — ตอน Lab 05 ต้อง `ORDER BY id DESC` (กันกรณี `created_at` ซ้ำกันในวินาทีเดียว) |
| 3 | GET อื่น ๆ → UI แสดง "ยังโหลดคำทักไม่ได้" | **match** | UI เช็ก `res.ok` แล้ว fallback ทุกสถานะ · route เดิมคืน 500/501 ได้ถูกต้อง |
| 4 | `POST` body JSON `{ name, message }` (UI trim แล้ว) | **match + suggestion** | route รับ JSON แล้วส่งต่อให้ helper · **แนะนำ:** server ต้อง trim/validate ซ้ำเอง (D4: validate ฝั่ง server เป็นหลัก) และเช็กว่า body เป็น object ที่มี string จริง ไม่ใช่เชื่อ client |
| 5 | สำเร็จ → `201` + entry | **match** | route คืน 201 + row อยู่แล้ว (รอ helper จริง) |
| 6 | `400 { error: "INVALID_INPUT" }` — ว่าง / ชื่อ > 30 / ข้อความ > 280 | **mismatch (กลไก)** | route ปัจจุบันเอา `err.message` มาเป็น `error` ตรง ๆ → จะได้รหัสถูกก็ต่อเมื่อ helper โยน `Error('INVALID_INPUT')` พอดี ซึ่งเปราะ · **แนะนำ:** helper โยน error ที่มี `code` ชัดเจน แล้ว route map code → status · JSON parse พัง / body ไม่ใช่ object → นับเป็น `INVALID_INPUT` ด้วย |
| 7 | `400 { error: "INVALID_LINK" }` — มีลิงก์ | **mismatch (ยังไม่ได้ implement)** | stub ยังไม่เช็ก · **แนะนำ:** pattern ฝั่ง server ต้องครอบกว่า UI (UI เช็กแค่ `https?://` กับ `www.` แต่ D4 รวม "โดเมนติดตัวอักษร" เช่น `abc.com`) และเช็กทั้ง `name` + `message` ให้ตรงพฤติกรรม UI |
| 8 | `429 { error: "RATE_LIMITED" }` — เกิน 1 ข้อความ/นาที/IP | **mismatch** | route ไม่มี branch 429 เลย (ทุก error ที่ไม่ใช่ NOT_IMPLEMENTED กลายเป็น 400) · **แนะนำ:** เก็บ `Map<ip, timestamp>` ระดับ module หมดอายุไม่กี่นาที ห้ามลง DB/log (ตาม D4) · map code `RATE_LIMITED` → 429 ใน route · หลัง proxy (Coolify) ต้องอ่าน IP จาก `clientAddress`/header ให้ถูก ไม่อย่างนั้นทั้งเว็บโดนนับรวมเป็น IP เดียว |
| 9 | `403 { error: "READONLY" }` — เมื่อ `GUESTBOOK_READONLY=1` | **mismatch** | ยังไม่มีการอ่าน env นี้ · **แนะนำ:** เช็ก `process.env.GUESTBOOK_READONLY === '1'` ก่อน insert ใน route (หรือ helper) แล้วคืน 403 — UI มีข้อความรองรับแล้ว |
| 10 | `error` ต้องเป็นรหัสสั้น ไม่ใช่ข้อความเทคนิค/stack (D9) | **mismatch** | route ปัจจุบันส่ง `err.message` ดิบ เช่น `NOT_IMPLEMENTED: insertGuestbook — Lab 05 OpenCode` — รายละเอียดในข้อ 2 |
| 11 | ไม่มี UI ไหนเรียก `/api/contact` (D3) | **match** | ตรวจแล้ว: `contact.astro` เป็น redirect 301 → `/guestbook` ล้วน ๆ · `guestbook.astro` ยิงแค่ `/api/guestbook` · ไม่มี fetch ถึง `/api/contact` ใน UI |

สรุป: **รูปทรง request/response หลัก match เกือบหมด** สิ่งที่ mismatch คือ "กลไก error" ของ route (เอา message ดิบมาเป็น code + ไม่มี branch 429/403) และพฤติกรรมที่ stub ยังไม่ได้ implement — ทุกจุดแก้ได้ใน Lab 05 โดย UI ไม่ต้องเปลี่ยน

## 2. route ส่ง `err.message` ดิบ ขัด D9 ไหม

**ตัวอักษรของ D9:** D9 ห้ามข้อความเทคนิค/อ้างอิงคอร์สบน"หน้าเว็บที่ render" — API response เป็น JSON ไม่ได้ render และ UI ไม่เคยแสดง `error` ที่ไม่รู้จัก (fallback เป็น "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง" เสมอ) → **ตามตัวอักษรยังไม่ขัด** และ `tests/public-site.test.ts` ก็จับแค่ markup ที่ render ไม่จับ JSON

**จิตวิญญาณของ D9:** **ขัด** — D9 ให้เหตุผลไว้ชัดว่า "เผย API ให้ bot" และ "ไม่โชว์รายละเอียดเทคนิค" · ใครก็ได้ที่ `curl -X POST /api/guestbook` ตอนนี้จะเห็น `NOT_IMPLEMENTED: insertGuestbook — Lab 05 OpenCode` = เปิดเผยทั้งชื่อฟังก์ชันภายในและบริบทคอร์สสู่สาธารณะ ทั้งที่เว็บนี้คือเว็บ personal branding จริง

**ควรแก้ใน Lab 05 อย่างไร:**

1. กำหนดชุดรหัส error ปิด: `INVALID_INPUT` · `INVALID_LINK` · `RATE_LIMITED` · `READONLY` · `SERVER_ERROR` (และ `GONE` สำหรับ contact — ข้อ 3)
2. helper ใน `db.ts` โยน error ที่ติด `code` (เช่น class เล็ก ๆ หรือ property บน Error) — route map `code → status` ผ่านตารางเดียว ไม่ parse string จาก message
3. error ที่ไม่รู้จัก (DB พัง ฯลฯ) → คืน `500 { error: "SERVER_ERROR" }` เสมอ · รายละเอียดจริง `console.error` ไว้ฝั่ง server เท่านั้น ห้ามส่ง stack/SQL ออกไป (ตรงกับ skill public-site-safe: ห้าม leak stack/SQL)
4. เอา branch `NOT_IMPLEMENTED → 501` ออกเมื่อ implement เสร็จ — ไม่ควรเหลือหลุดไปถึง production

ข้อดีเพิ่มเติม: UI ฝั่ง Claude ผูกข้อความกับรหัสอยู่แล้ว (`MESSAGES[code]`) การเปลี่ยนนี้จึง**ไม่กระทบ UI เลย** แค่ทำให้สิ่งที่หลุดออกไปสาธารณะสะอาดขึ้น

## 3. ข้อเสนอหมายเหตุ D3: `insertContact` ผ่าน tests/labs แต่ไม่เปิดรับข้อมูลสาธารณะ

สำคัญ: `tests/labs/lab05-api.test.ts` import `insertContact` จาก `src/lib/db.ts` **โดยตรง** ไม่ผ่าน HTTP → แยกสองชั้นนี้ออกจากกันได้สะอาด:

1. **`src/lib/db.ts`** — implement `insertContact` จริง (validate name/email/message ไม่ว่าง → insert → คืน row) ให้ test `insertContact persists a row` เขียว · ตาราง `contact_messages` ใน `getDb()` คงไว้เพราะ test ใช้
2. **`src/pages/api/contact.ts`** — เปลี่ยน POST ให้ตอบ **`410 Gone`** พร้อม `{ error: "GONE" }` **โดยไม่แตะ `request.body` เลย** (ไม่ parse ไม่ validate ไม่เรียก helper) — "ไม่เปิดรับข้อมูลสาธารณะ" แบบตัวอักษรที่สุดคือไม่ประมวลผลข้อมูลที่ส่งมาแม้แต่นิดเดียว

เลือก 410 (เก็บไฟล์ route ไว้) มากกว่า 404 (ลบไฟล์) เพราะ:
- 410 สื่อชัดว่า endpoint นี้**เคยมีแต่ถอดถาวร** ตรงความหมาย D3 ("ตัดออกจาก v1") มากกว่า 404 ที่อ่านได้ว่า "ไม่เคยมี"
- ไฟล์ที่เหลืออยู่ + คอมเมนต์อ้าง D3 เป็นเอกสารประจำโค้ด กันคนมาเผลอ implement ซ้ำโดยไม่รู้เหตุ
- ถ้า human อยากได้ 404 ล้วน ๆ ก็แค่ลบไฟล์ตอน Lab 05 — ทั้งสองทางผ่านหมายเหตุ D3 (ระบุ "404/410" ไว้) · **ขอ human ตัดสินตอนเปิดงาน Lab 05** (backend เสนอ 410)

หมายเหตุ: helper `insertContact` ที่ implement แล้วจะไม่มีผู้ใช้ใน production code เลย (มีแค่ test) — ยอมรับได้เพราะเป็นข้อผูกพันของ `tests/labs` ไม่ใช่ช่องทางรับข้อมูล

## 4. คำถามถึง frontend (ต้องตอบก่อน Lab 05)

> **อัปเดต 2026-09-25:** ทั้ง 3 ข้อถูกตอบแล้ว — Claude ยืนยันใน [`docs/handoffs/04-claude-to-opencode.md`](handoffs/04-claude-to-opencode.md) §3: (1) `created_at` = ISO 8601 UTC ตกลง (2) เช็กลิงก์ทั้ง `name` + `message` ตรงกับ UI · server pattern ครอบกว้างกว่าได้ (3) ไม่ต้องใส่ `Retry-After` ใน v1 → ข้อสรุปข้างล่างคงไว้เป็นหลักฐานการตกลงครั้งแรก

1. **ฟอร์แมต `created_at`:** SQLite `datetime('now')` ให้ `YYYY-MM-DD HH:MM:SS` (UTC แต่ไม่มี Z) — `new Date()` ของบาง browser parse แบบนี้เป็น local time หรือพัง (Safari) ทำให้ `formatDate` คืนค่าว่าง/วันที่คลาด · backend เสนอคืนเป็น **ISO 8601 UTC** (`new Date().toISOString()` → `2026-09-25T10:00:00.000Z`) ตอน insert · frontend รับฟอร์แมตนี้โอเคไหม (`toLocaleDateString('th-TH')` น่าจะทำงานปกติ)?
2. **เช็กลิงก์ในชื่อด้วยไหม:** UI เช็ก `LINK_PATTERN` ทั้ง `name` และ `message` · D4 พูดถึง "ข้อความ" แต่ backend จะทำตาม UI (เช็กทั้งคู่ → `INVALID_LINK`) — ยืนยันว่าตรงกัน?
3. **`Retry-After` บน 429:** ตอนนี้ UI แสดงข้อความคงที่ ไม่อ่าน header — backend เลยจะ**ไม่ใส่** `Retry-After` ถ้า frontend ไม่ต้องการ · โอเคไหม หรืออยากเอาไว้ทำ countdown ภายหลัง?

ไม่มีคำถามอื่น — read-after-write (POST แล้ว GET เจอของใหม่ทันที) ไม่มีปัญหาเพราะทั้งคู่อยู่ process/connection เดียวกัน
