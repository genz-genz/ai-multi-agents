# Project Status

> อ่านทุก session · **สั้น** · single-writer ต่อรอบ  
> ดู [`COURSE.md`](../COURSE.md) ชั้น State (Hot)

Last updated: 2026-09-25 15:35 +07:00  
Updated by: Claude

## Current goal

- Lab 05 backend เสร็จ (branch `lab-05-backend` · ต่อจาก `lab-04-frontend`) → ถัดไป Lab 06 QA

## Done

- **Swarm guestbook/API** (Claude · 12/20 turns · `docs/SWARM.md`): test:labs 2/2 · npm test 29/29 · build ผ่าน · ส่งฟอร์มทักทายผ่านเบราว์เซอร์จริงได้ · contact 410 · บันทึก D13 · ช่องว่าง → L12–L14
- **L10 / Lab 05 backend เสร็จ** (OpenCode): `src/lib/db.ts` — `insertGuestbook` / `listGuestbook` / `insertContact` implement จริง (better-sqlite3) + validate ฝั่ง server (D4: trim · 30/280 · ปฏิเสธลิงก์รวมโดเมนติดตัวอักษร · ไม่เก็บอีเมล/IP) + `ApiError` รหัสปิด (D9) · `src/pages/api/guestbook.ts` — map รหัส→status (400/403/429/500) · rate limit 1 ข้อความ/นาที/IP ใน memory (TTL 5 นาที · นับเฉพาะโพสต์สำเร็จ · validate ก่อน gate เพื่อให้ error ชัดก่อนขำ) · อ่าน IP จาก `x-forwarded-for` ก่อน `clientAddress` (หลัง proxy) · `GUESTBOOK_READONLY=1` → 403 (D5) · `src/pages/api/contact.ts` — **410 GONE ไม่ parse body** (D3 · human เลือก 410 แทน 404 · รอ Claude บันทึกเป็น D-id ใน DECISIONS.md) · `created_at` = ISO 8601 UTC ตามสัญญาที่ตกลง · **ผลตรวจ: `test:labs` 2/2 · `npm test` 29/29 · build ผ่าน · smoke HTTP จริงครบเมทริกซ์** (GET 200 · POST 201 · 429 · INVALID_LINK · INVALID_INPUT · 410 · READONLY 403 โดย GET ยัง 200) · คู่มือลบ `docs/GUESTBOOK.md` (D5) · รายละเอียดใน `docs/handoffs/05-L10-opencode-to-claude.md`
- **D12 การ์ดเพลง = เพลย์ลิสต์ Top 100: Thailand** (Claude · แทน D11): Apple Music embed แบบเพลย์ลิสต์ใน `index.astro` · มีปุ่มถัดไป/ก่อนหน้าในตัว · หน้าแรกไม่เรียก `getRandomSong()` แล้ว (ค้าง L11: จะเก็บหรือลบ `music.ts`)
- **L9 / Lab 04 UI เสร็จ** (Claude · `2a3063e`): 3 หน้าเมนูไทย (`/interests` `/contact` → 301) · หน้าแรก headline/tagline/ประโยคสุ่ม/การ์ดเพลง · หน้าทักทาย (limit + microcopy + `textContent`) · ธีมขาว my-ci · `npm test` 29/29 · build ผ่าน · 360px ไม่ล้น · สัญญา API ตรวจโดย OpenCode → `docs/fe-be-contract-check.md`
- **L5 / Lab 02 เสร็จ** (2026-09-25): `docs/DEBATE.md` 3 มุม + `docs/DECISIONS.md` D1–D10 · human เลือก: 3 หน้าเมนูไทย · ตัดฟอร์ม Contact · rate limit IP ใน memory · เจ้าของลบข้อความเองภายใน 24 ชม. · PROFILE เพิ่ม `## Tagline`
- **L7 ปิด** (2026-09-25): ชาร์ตว่างเข้า backoff (OpenCode `f36b393`) · Claude ยืนยันว่า Astro โหลด page แบบ lazy จึงทำ boot warm-up ใน app ไม่ได้ · human เลือกยอมรับไปก่อน → แก้ตอน deploy (L8)
- Lab 01 เสร็จ: `docs/PROFILE.md` ครบโครง + `## Brainstorm`
- **L3 เพลงสุ่ม ฝั่ง server เสร็จ** (OpenCode · 2026-09-25): `src/lib/music.ts` — cache TTL 1 ชม. · stale-on-error · timeout 3s · validate `music.apple.com` URL · ไม่ throw (พัง = `null`) · `npm test` 15/15 + `npm run build` ผ่าน · สเปก/สัญญาใน `docs/handoffs/05-claude-to-opencode.md` · ส่งกลับที่ `docs/handoffs/05-opencode-to-claude.md`
- **L3 UI เสร็จ** (Claude): การ์ด "เพลงสุ่มวันนี้" ใน `src/pages/index.astro` · `null` = ซ่อนการ์ด · localhost ตอบ 200 และแสดงเพลงจริง
- **L4 เสร็จ** (Claude): ประโยคสุ่มใต้ headline หน้าแรก · `src/lib/tagline.ts` แม่แบบไทย 7 แบบ + Interests · ไม่พึ่งเน็ต · `npm test` 20/20
- **L2 เสร็จ** (Claude · `a1c7320`): parser อ่าน Bio ทุกย่อหน้า + Interests ทุกข้อ · มี `tests/profile.test.ts`
- **L6 เสร็จ** (OpenCode · 2026-09-25): หน้าแรกไม่รอ Apple — warm-up ตอน import · stale-while-revalidate · cold-start wait ≤1s (`WAIT_MS`) · single-flight · backoff 60s (`BACKOFF_MS`) · fetch timeout 8s · `__resetForTest()` สำหรับ test · วัดจริง dev server: `/` จาก 3045ms → **1067ms** แล้ว 214ms · การ์ดขึ้นจริง · `npm test` 25/25 + build ผ่าน · สเปก `docs/handoffs/05b-claude-to-opencode.md` · ส่งกลับ `docs/handoffs/05b-opencode-to-claude.md`
- **L7 ข้อ 2 เสร็จ** (OpenCode · 2026-09-25): ชาร์ตว่าง = failure → backoff 60s เหมือน error · ไม่ทับ cache เก่า · `npm test` **26/26** + build ผ่าน · **ข้อ 1 (boot warm-up) ทำไม่ได้ภายในขอบเขต → หยุดตามเงื่อนไข** — middleware lazy (พิสูจน์ด้วยโค้ด build + วัดจริง) · ไม่มี prod boot hook · `inlineDynamicImports` ถูก rolldown reject · รอ decision (หลักฐาน + ทางเลือกใน `docs/handoffs/05c-opencode-to-claude.md`)

## In progress

- —

## Blocked

- —

## Next actions

1. OpenCode: L12 (rate limit ข้ามด้วย `x-forwarded-for`) · human: L14 (stash บน main)
2. Human: review + merge PR `lab-04-frontend` แล้ว merge `lab-05-backend` (ต่อกัน ตามลำดับ)
3. Lab 06 QA: e2e ผูกฟอร์มจริงกับ API ที่ implement แล้ว

## Files changed in latest session

- `src/lib/db.ts` · `src/pages/api/guestbook.ts` · `src/pages/api/contact.ts`
- `docs/GUESTBOOK.md` (ใหม่) · `docs/STATUS.md` · `docs/OPEN_LOOPS.md` · `docs/handoffs/05-L10-opencode-to-claude.md`

## Notes

- Proposed vs Approved: Apple Music RSS + ประโยคสุ่ม ยัง proposed ใน `DEBATE.md` — รอปิดเป็น D-id
- `## Brainstorm` ไม่ถูก render บนเว็บ (`profile.ts` ไม่อ่านหัวข้อนี้)
- Rate limit อยู่ใน memory ของ process — สมมุติรัน 1 container ต่อเว็บ (ถ้า scale หลาย instance นับแยกกัน — ยอมรับไว้ใน handoff Lab 04 แล้ว)