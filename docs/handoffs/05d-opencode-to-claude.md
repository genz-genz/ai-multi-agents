# Handoff: OpenCode → Claude

Timestamp: 2026-09-25 15:58 +07:00  
Task: L12 — ปิดช่องข้าม rate limit ด้วย `x-forwarded-for` ปลอม + เพดานขนาด body ของ `POST /api/guestbook`  
Status: IMPLEMENTED

## What changed

- `clientIp()` ตามทาง A: เชื่อ XFF เฉพาะ `process.env.TRUST_PROXY === '1'` (อ่าน env ทุก request แบบ `GUESTBOOK_READONLY`) และใช้**ตัวท้ายสุด**ของ list · ไม่ตั้ง/ค่าอื่น → `clientAddress` ล้วน (ปลอมไม่ได้)
- เพดาน body 10KB (`MAX_BODY_BYTES`) → 400 `INVALID_INPUT` (ชุดปิด D9 · ไม่เพิ่ม code) — 2 ชั้น: `content-length` ก่อนอ่าน + เช็ก byte จริงหลัง `request.text()` (กัน chunked ที่ไม่ส่ง content-length · ต่างจากร่างในรีวิวที่เสนอ 1 เงื่อนไข — เลือกปิดช่องให้ครบ)
- Test ใหม่ `tests/guestbook-ip.test.ts` 4 เคส (mock context เรียก `POST` ตรง ไม่ต้องรัน server · แยก IP/ clientAddress คนละตัวทุกเคสจึงไม่ต้อง export helper reset)
- `docs/GUESTBOOK.md` เพิ่มหัวข้อ **Deploy** — ให้ Lab 08 ตั้ง `TRUST_PROXY=1` ใน Coolify env (ไม่ใส่ Dockerfile ตาม assumption เดิม) + แถว body ≤10KB ในตารางตัวเลข

## Files

- แก้: `src/pages/api/guestbook.ts` · `docs/GUESTBOOK.md` · `docs/STATUS.md` · `docs/OPEN_LOOPS.md`
- สร้าง: `tests/guestbook-ip.test.ts` · `docs/handoffs/05d-opencode-to-claude.md`
- ไม่ได้แตะ: UI / `playwright/` / `tests/labs/` / `DECISIONS.md` / `SWARM.md` / `Dockerfile`

## Verification

- RED ก่อนแก้ (`npx vitest run tests/guestbook-ip.test.ts`): **3 fail / 4** — XFF ปลอมไม่มี TRUST_PROXY ได้ 201 (ควร 429) · XFF ตัวแรกปลอมใต้ TRUST_PROXY=1 ได้ 201 (ควร 429) · body 20KB ได้ 201 (ควร 400) · เคส fallback clientAddress ผ่านทั้งก่อน/หลัง (characterization)
- GREEN หลังแก้: **4/4 ผ่าน**
- Unit / smoke: PASS — `npm test` **33/33** (29 เดิม + 4 ใหม่)
- Labs (`npm run test:labs`): PASS **2/2**
- Build: PASS — `npm run build` (astro build สำเร็จ)
- Commit: `71f37fe` `fix(backend): trust only last XFF entry behind TRUST_PROXY=1 + 10KB body cap on guestbook POST (L12)` บน `lab-05-backend` (handoff ไฟล์นี้ commit แยกถัดไป)

## Assumptions to challenge

1. Coolify proxy เป็น 1 hop และ **append** XFF → ตัวท้ายสุดคือ IP ที่ proxy เห็นจริง (ยังไม่ได้พิสูจน์กับ deploy จริง — ตรวจตอน Lab 08; ถ้า proxy เขียนทับ header ทั้งก้อนก็ยังปลอดภัย เพราะตัวท้ายสุด = ตัวเดียวที่ proxy ใส่)
2. `TRUST_PROXY=1` ตั้งใน **Coolify env** ไม่ใส่ `Dockerfile` (ตามที่ Claude เลือก) — ถ้ามีคนรัน container ตรง ๆ โดยไม่มี proxy จะไม่เปิดช่องกลับ · ผลคือ deploy ที่ลืมตั้ง env จะเห็นทุกคนเป็น IP เดียว (rate limit เข้มเกิน ไม่ใช่หลวมเกิน = fail-closed)
3. เพดาน body เช็กหลังอ่าน `request.text()` ทั้งก้อน — body ขนาดมหาศาล (เช่น 50MB chunked) ยังถูก buffer ก่อนตัดทิ้ง · เพดานจริงระดับ stream เป็นของ reverse proxy/node adapter นอกขอบเขต L12
4. e2e เคส XSS เดิม seed ด้วย XFF ปลอม (SWARM G5) จะ skip/พังหลัง fix นี้ → L13 เป็นของ Claude ต้องหาวิธี seed ใหม่ (เช่น seed ผ่าน `insertGuestbook` ตรง ๆ หรือรัน server e2e โดยไม่ตั้ง TRUST_PROXY แล้วใช้ clientAddress เดียวกัน)

## Request to next agent

- Claude (Lab 06): ทำ L13 — ปรับ `playwright/guestbook.spec.ts` เคส XSS ให้ seed ด้วยวิธีที่ไม่พึ่ง XFF ปลอม · เคส e2e อื่นแนะนำใน `docs/review-swarm2-backend.md` §3
- ห้ามแตะ `src/pages/api/*` / `src/lib/db.ts` (ownership OpenCode) — ถ้า e2e พบพฤติกรรม API ไม่ตรงสัญญา ให้เขียนรายงาน/ handoff กลับ ไม่แก้เอง
- Lab 08: อย่าลืมตั้ง `TRUST_PROXY=1` ใน Coolify env (ดู `docs/GUESTBOOK.md` หัวข้อ Deploy)

## Canonical state updated

- [x] `docs/STATUS.md` (L12 ปิด · next actions ใหม่)
- [x] `docs/OPEN_LOOPS.md` (ย้าย L12 ไปตารางปิดแล้ว · L13 พร้อมทำใน Lab 06)
- [ ] `docs/DECISIONS.md` — ไม่มี decision ใหม่ (bugfix ภายใต้ D4/D9)
- [ ] อื่น ๆ: `docs/SWARM.md` — ไม่ได้แตะ (อยู่นอกสโคปที่อนุญาต · swarm รอบ 2 ปิดไปแล้วฝั่ง Claude)

## Single-writer note

Writer รอบถัดไปของ STATUS/OPEN_LOOPS = Claude (หลัง OpenCode commit handoff นี้)
