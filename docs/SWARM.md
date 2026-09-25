# Swarm Log — guestbook/API readiness

> รอบ: 2026-09-25 · Harness: Claude Code (agent หลัก · ไม่ spawn sub-agent เพิ่ม — backend เสร็จแล้วจาก OpenCode) · Branch: `lab-05-backend` · Ceiling: 20 turns

## Done criteria (ปรับตามสถานะจริง)

1. `npm run test:labs` เขียว
2. ส่งฟอร์ม **guestbook** บน localhost ได้จริง · **contact ไม่มีฟอร์มแล้ว** (D3) → เกณฑ์คือ `POST /api/contact` = 410 GONE (D13) และ `/contact` → 301

## Turns used

| Turn | งาน |
|---|---|
| 1 | พบ working tree อยู่ที่ `main` (Initial commit) พร้อมงาน OpenCode ค้างไม่ commit → human สั่ง stash แล้วสลับไป `lab-05-backend` (`stash@{0}`) |
| 2 | อ่าน handoff `05-L10-opencode-to-claude.md` · STATUS · OPEN_LOOPS · `test:labs` **2/2 เขียว** |
| 3 | `npm test` 29/29 · build ผ่าน · ตรวจ `guestbook.astro`: render ด้วย `textContent` ล้วน |
| 4 | อ่าน submit handler — body `{ name, message }` JSON · map รหัส error → microcopy |
| 5 | HTTP smoke บน build จริง (`DATA_DIR` ชั่วคราว · port 4331): 200/201/429/400×3/410/301 ตรงสเปก |
| 6 | ตรวจภาษาไทย: server เก็บ UTF-8 ถูก (`?????` ใน turn 5 มาจาก curl ของ Git Bash ส่ง arg เป็น codepage Windows) |
| 7 | สำรวจ Playwright ใน repo — `playwright/smoke.spec.ts` ยังเช็กฟอร์ม contact ที่ถูกตัด |
| 8 | สคริปต์ demo ชั่วคราว (scratchpad) — Playwright ไม่มี browser ที่ดาวน์โหลดไว้ |
| 9 | ใช้ Edge (`channel: 'msedge'`) · ครั้งแรกโดน 429 เพราะยังอยู่ในหน้าต่าง 1 นาทีจาก turn 5 |
| 10 | รันใหม่หลังพ้นหน้าต่าง: ส่งสำเร็จ → "ได้รับแล้ว" + ขึ้นในรายการ · ส่งซ้ำ → microcopy rate limit · payload `<img onerror>` ไม่ถูก inject · ไม่มี JS error |
| 11 | ปิด server · ลบ `DATA_DIR` ชั่วคราวและไฟล์ทดสอบ |
| 12 | บันทึก D13 (410 GONE) · เขียนไฟล์นี้ · อัปเดต STATUS / OPEN_LOOPS |

**รวม 12 / 20 turns — หยุดเพราะ done ก่อนเพดาน**

## Outcome

- ✅ `npm run test:labs` 2/2 · `npm test` 29/29 · `npm run build` ผ่าน — ไม่ได้แก้ไฟล์ test ใด ๆ
- ✅ Guestbook ส่งได้จริงผ่านเบราว์เซอร์ (Edge headless · 360px) และผ่าน HTTP: validate D4 · rate limit · error ชุดปิด D9 · ภาษาไทยถูกต้อง · XSS ไม่ทำงาน
- ✅ Contact: `POST /api/contact` → 410 GONE · `/contact` → 301 (D3/D13)
- ไม่มีการแก้โค้ดในรอบนี้ (backend เสร็จจาก OpenCode `fe1838d` · UI ไม่ต้องแก้) — แตะเฉพาะ `docs/`

## Gaps

| ID | ช่องว่าง | Owner |
|---|---|---|
| G1 | **ข้าม rate limit ได้ด้วย `x-forwarded-for` ปลอม** — route เชื่อ header นี้เสมอ ถ้าเว็บไม่ได้อยู่หลัง proxy ที่เขียนทับ header (หรือ proxy แค่ต่อท้าย) ผู้ส่งเปลี่ยน IP ปลอมได้ทุกครั้ง · ยืนยันด้วย smoke turn 5 | OpenCode backend (+ ตรวจ proxy ตอน Lab 08) |
| G2 | `playwright/smoke.spec.ts` ยังเช็ก "contact page has form fields" ซึ่งขัด D3 → e2e จะแดง · ต้องเขียน e2e guestbook จริงแทน | Lab 06 QA |
| G3 | เครื่องนี้ไม่มี browser ของ Playwright (`npx playwright install` ยังไม่รัน) · Playwright MCP หลุดระหว่างรอบ | human |
| G4 | งาน OpenCode บน `main` ถูกเก็บใน `stash@{0}` (db.ts คนละ implementation · SWARM/STATUS/OPEN_LOOPS · `opencode.json`) — รอ human ตัดสินว่าทิ้งหรือดึง `opencode.json` กลับ | human |

## กติกาที่ปฏิบัติ

- skill `public-site-safe` · ไม่แก้ test · ไม่ commit `.env` / ไม่พิมพ์ secret · ไม่ใช้ MCP เป็นท่อ Claude ↔ OpenCode
- ข้อมูลทดสอบอยู่ใน `DATA_DIR` ชั่วคราวเท่านั้น ลบแล้ว · ไม่แตะ `data/site.sqlite`
