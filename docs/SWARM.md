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

---

# รอบ 2 — ใช้ skill `opencode` (call ข้าม harness)

> 2026-09-25 · Harness: Claude Code + OpenCode (headless one-shot 1 ครั้ง) · Branch: `lab-05-backend` · Ceiling: 20 turns (นับใหม่)

## Done criteria

1. `npm run test:labs` เขียว — ✅ (ตั้งแต่ turn 1)
2. ส่งฟอร์ม guestbook บน localhost ได้ → รอบนี้ทำให้**ทดสอบซ้ำได้อัตโนมัติ** (e2e) · contact = 410/301 (D13)
3. ปิดช่องว่างรอบ 1 เท่าที่อยู่ใน ownership: G1 → ส่ง OpenCode · G2 → Claude แก้

## Turns used

| Turn | งาน |
|---|---|
| 1 | ตรวจสถานะ: `lab-05-backend` สะอาด · `test:labs` 2/2 · D13 · L12–L14 |
| 2 | เขียน `docs/_call-opencode-prompt.md` (อ่านอย่างเดียว · เขียนได้ไฟล์เดียว `docs/review-swarm2-backend.md`) |
| 3 | `opencode run` one-shot — OpenCode อ่าน DECISIONS/SWARM/API/Dockerfile · รัน `npm test` · เขียนรายงาน |
| 4 | ตรวจว่า OpenCode แตะแค่ไฟล์รายงาน (git status) · อ่านรายงาน |
| 5 | ยืนยันคำอ้างกับโค้ด (`guestbook.ts:50-51` XFF ตัวแรก · `:74` ไม่มีเพดาน body) · ลบไฟล์ prompt ชั่วคราว |
| 6 | Handoff `docs/handoffs/05d-claude-to-opencode.md` — L12 ทาง A (`TRUST_PROXY=1` ใน Coolify env · ใช้ XFF ตัวท้ายสุด) + เพดาน body 10KB |
| 7 | อ่าน e2e เดิม + markup ฟอร์ม |
| 8 | `playwright/guestbook.spec.ts` ใหม่ 4 เคส (สำเร็จ · 429 · validate ก่อน 429 · XSS) ตามรายงาน §3 · แทนเคส contact form เดิมด้วย 301 + 410 |
| 9 | `playwright.config.ts`: `PLAYWRIGHT_CHANNEL` (ออปชัน) ใช้ browser ที่ติดตั้งในเครื่องได้ |
| 10 | build + server `DATA_DIR` ชั่วคราว · `test:e2e` ผ่าน Edge → **6/6 ผ่าน** |
| 11 | ปิด server · ลบข้อมูลทดสอบ · `npm test` 29/29 · `test:labs` 2/2 |
| 12 | อัปเดตไฟล์นี้ + STATUS / OPEN_LOOPS · commit ก่อนส่งต่อ OpenCode |

**รวม 12 / 20 turns — หยุดเพราะ done ในส่วนของ Claude · ส่วน backend รอ OpenCode implement ตาม handoff**

## Outcome

- ✅ `test:labs` 2/2 · `npm test` 29/29 · `test:e2e` 6/6 · build ผ่าน · ไม่แก้ test เพื่อให้ผ่าน (แก้เฉพาะเคส contact ที่ขัด D3 ให้ตรง D13)
- ✅ OpenCode รีวิวผ่าน skill `opencode` เขียนเฉพาะ `docs/review-swarm2-backend.md` — ยืนยัน G1 · API ตรง D4/D5/D9/D13 · พบเพิ่ม: ไม่มีเพดาน body
- ✅ G2 ปิด (e2e ตรง D3) · G3 เลี่ยงได้ด้วย `PLAYWRIGHT_CHANNEL=msedge`

## Gaps

| ID | ช่องว่าง | Owner |
|---|---|---|
| G1 / L12 | XFF ปลอมข้าม rate limit + ไม่มีเพดาน body — **handoff แล้ว** `05d-claude-to-opencode.md` | OpenCode |
| G5 | เคส XSS ใน e2e ใช้ XFF ปลอมเพื่อเลี่ยง rate limit → หลัง L12 จะ **skip** ตัวเอง (ไม่แดง) · ต้องหาวิธี seed ใหม่ (เช่น รันหลังพ้นหน้าต่าง 60s หรือ seed ผ่าน SQLite ก่อนเปิด server) | Claude (Lab 06) |
| G4 / L14 | `stash@{0}` บน `main` ยังรอตัดสิน | human |
