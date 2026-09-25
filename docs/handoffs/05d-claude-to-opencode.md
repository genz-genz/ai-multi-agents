# Handoff: Claude → OpenCode

Timestamp: 2026-09-25 15:45 +07:00  
Task: L12 — ปิดช่องข้าม rate limit ด้วย `x-forwarded-for` ปลอม + เพดานขนาด body ของ `POST /api/guestbook`  
Status: NEEDS_REVIEW → รอ OpenCode implement

## What changed

- Swarm รอบ 2 (Claude) เรียก OpenCode แบบ headless ผ่าน skill `opencode` → รายงาน [`docs/review-swarm2-backend.md`](../review-swarm2-backend.md)
- Claude ตรวจคำอ้างกับโค้ดแล้ว: `src/pages/api/guestbook.ts:50-51` เชื่อ XFF ตัวแรกทุกครั้ง · `:74` อ่าน body ทั้งก้อนไม่มีเพดาน — **ตรงจริง**
- รอบนี้ Claude ไม่แตะไฟล์ backend

## Files

- ที่จะแก้ (ของ OpenCode): `src/pages/api/guestbook.ts` · test ใหม่ (เช่น `tests/guestbook-ip.test.ts`) · `docs/GUESTBOOK.md`
- ห้ามแตะ: `src/pages/*.astro` · `src/layouts/` · `playwright/` · `docs/DECISIONS.md`

## Verification

- Unit / smoke: PASS — `npm test` 29/29 (baseline ก่อนแก้)
- Labs (`npm run test:labs`): PASS 2/2
- Manual / localhost: SWARM รอบ 1 turn 5 — XFF ปลอมทำให้ POST ที่ควรเป็น 429 ได้ 201

## Assumptions to challenge

1. Coolify proxy เป็น 1 hop และ **append** XFF → ตัวท้ายสุดคือ IP จริง (ถ้า Lab 08 พบว่าไม่ใช่ ต้องทบทวน)
2. **`TRUST_PROXY=1` ตั้งใน Coolify env ไม่ใส่ใน `Dockerfile`** (Claude เลือกตามข้อสังเกตในรายงาน §1) — ถ้ามีคนรัน container ตรง ๆ โดยไม่มี proxy จะไม่เปิดช่องกลับ · ถ้าไม่เห็นด้วยให้เขียนเหตุผลใน handoff กลับ

## Request to next agent

**Implement (OpenCode · agent `backend`):**

1. `clientIp()` ตามทาง A ในรายงาน §1: เชื่อ XFF เฉพาะ `process.env.TRUST_PROXY === '1'` และใช้**ตัวท้ายสุด** · ไม่งั้นใช้ `clientAddress`
2. เพดาน body ~10KB ก่อน `request.json()` → `400 INVALID_INPUT` (ชุด error ปิดเดิมของ D9 · ไม่เพิ่ม code ใหม่)
3. Test 3 เคสตามรายงาน §1 (+1 เคส body ใหญ่) — ต้อง RED ก่อนแก้
4. บันทึก `TRUST_PROXY=1` ใน `docs/GUESTBOOK.md` (หัวข้อ deploy) ให้ Lab 08 ตั้งใน Coolify
5. `npm test` + `npm run test:labs` + `npm run build` เขียว → commit บน `lab-05-backend` → อัปเดต STATUS / OPEN_LOOPS (ปิด L12) → handoff กลับ `05d-opencode-to-claude.md`

## Canonical state updated

- [x] `docs/STATUS.md`
- [x] `docs/OPEN_LOOPS.md` (L12 ชี้มาที่ handoff นี้)
- [ ] `docs/DECISIONS.md` — ไม่มี decision ใหม่ (เป็น bugfix ภายใต้ D4)
- [x] อื่น ๆ: `docs/SWARM.md` (รอบ 2) · `docs/review-swarm2-backend.md`

## Single-writer note

Writer รอบถัดไปของ STATUS/OPEN_LOOPS = OpenCode (หลัง Claude commit handoff นี้)
