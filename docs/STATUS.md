# Project Status

> อ่านทุก session · **สั้น** · single-writer ต่อรอบ  
> ดู [`COURSE.md`](../COURSE.md) ชั้น State (Hot)

Last updated: 2026-09-25 12:30 +07:00  
Updated by: OpenCode

## Current goal

- Lab 02: ย้ายข้อเสนอจาก `## Brainstorm` เข้า debate → ปิดเป็น D-id ใน `DECISIONS.md` (ฝั่ง Claude) · L2 + L3 + L4 + L6 ปิดแล้ว · L7 ข้อ 2 เสร็จ ข้อ 1 รอ decision

## Done

- Lab 01 เสร็จ: `docs/PROFILE.md` ครบโครง + `## Brainstorm`
- **L3 เพลงสุ่ม ฝั่ง server เสร็จ** (OpenCode · 2026-09-25): `src/lib/music.ts` — cache TTL 1 ชม. · stale-on-error · timeout 3s · validate `music.apple.com` URL · ไม่ throw (พัง = `null`) · `npm test` 15/15 + `npm run build` ผ่าน · สเปก/สัญญาใน `docs/handoffs/05-claude-to-opencode.md` · ส่งกลับที่ `docs/handoffs/05-opencode-to-claude.md`
- **L3 UI เสร็จ** (Claude): การ์ด "เพลงสุ่มวันนี้" ใน `src/pages/index.astro` · `null` = ซ่อนการ์ด · localhost ตอบ 200 และแสดงเพลงจริง
- **L4 เสร็จ** (Claude): ประโยคสุ่มใต้ headline หน้าแรก · `src/lib/tagline.ts` แม่แบบไทย 7 แบบ + Interests · ไม่พึ่งเน็ต · `npm test` 20/20
- **L2 เสร็จ** (Claude · `a1c7320`): parser อ่าน Bio ทุกย่อหน้า + Interests ทุกข้อ · มี `tests/profile.test.ts`
- **L6 เสร็จ** (OpenCode · 2026-09-25): หน้าแรกไม่รอ Apple — warm-up ตอน import · stale-while-revalidate · cold-start wait ≤1s (`WAIT_MS`) · single-flight · backoff 60s (`BACKOFF_MS`) · fetch timeout 8s · `__resetForTest()` สำหรับ test · วัดจริง dev server: `/` จาก 3045ms → **1067ms** แล้ว 214ms · การ์ดขึ้นจริง · `npm test` 25/25 + build ผ่าน · สเปก `docs/handoffs/05b-claude-to-opencode.md` · ส่งกลับ `docs/handoffs/05b-opencode-to-claude.md`
- **L7 ข้อ 2 เสร็จ** (OpenCode · 2026-09-25): ชาร์ตว่าง = failure → backoff 60s เหมือน error · ไม่ทับ cache เก่า · `npm test` **26/26** + build ผ่าน · **ข้อ 1 (boot warm-up) ทำไม่ได้ภายในขอบเขต → หยุดตามเงื่อนไข** — middleware lazy (พิสูจน์ด้วยโค้ด build + วัดจริง) · ไม่มี prod boot hook · `inlineDynamicImports` ถูก rolldown reject · รอ decision (หลักฐาน + ทางเลือกใน `docs/handoffs/05c-opencode-to-claude.md`)

## In progress

- **L7 (ข้อ 1 boot warm-up) หยุดตามเงื่อนไข handoff** — พิสูจน์แล้วไม่มีกลไกในขอบเขตที่รันโค้ดตอน prod boot: middleware โหลด lazy (โค้ด build line 2194 + วัดจริง req1 card=no 2/2 รอบ) · ไม่มี integration boot hook · `inlineDynamicImports` ถูก rolldown reject → revert แล้ว · รอ human/Claude เลือกทางเลือก 1–4 ใน `docs/handoffs/05c-opencode-to-claude.md`

## Blocked

- L7 ข้อ 1 — บล็อกที่แพลตฟอร์ม (ไม่ใช่บั๊กโค้ด) ต้องมี decision ก่อนทำต่อ

## Next actions

1. Lab 02: ย้ายข้อเสนอจาก `## Brainstorm` ไป debate → ปิดเป็น D-id ใน `DECISIONS.md` (L5 · ฝั่ง Claude)
2. Human/Claude: เลือกทางแก้ L7 ข้อ 1 (ยอมรับพฤติกรรมปัจจุบัน / warm curl หลัง deploy / persist ชาร์ตลง disk / อื่น ๆ) → ถ้าเลือก persist ให้เข้า debate เป็น D-id ก่อน

## Files changed in latest session

- `src/lib/music.ts` (L7 ข้อ 2: ชาร์ตว่าง → backoff · เพิ่ม `warmUpChart()` export)
- `tests/music.test.ts` (ขยาย 13 → 14 tests: backoff ชาร์ตว่าง + ไม่ทับ stale cache)
- `docs/handoffs/05c-opencode-to-claude.md` (ใหม่)
- `docs/STATUS.md` · `docs/OPEN_LOOPS.md`
- `src/middleware.ts` สร้างแล้วลบ (พิสูจน์ว่าไม่ช่วย) · `astro.config.mjs` ลองแก้แล้ว revert = ไม่มี diff

## Notes

- Proposed vs Approved: Apple Music RSS + ประโยคสุ่ม ยัง proposed ใน `DEBATE.md` — รอปิดเป็น D-id
- `## Brainstorm` ไม่ถูก render บนเว็บ (`profile.ts` ไม่อ่านหัวข้อนี้)