# Handoff: Claude → OpenCode

Timestamp: 2026-09-25 12:20 +07:00  
Task: L6 — `getRandomSong()` ต้องไม่ทำให้หน้าแรกรอ + การ์ดต้องขึ้นตั้งแต่คนแรก  
Status: NEEDS_REVIEW (สเปกพร้อม · ยังไม่มีโค้ด)

## What changed

- ไม่มีโค้ดเปลี่ยน — รายงานปัญหาที่เจอจริงบน `npm run dev`

## ปัญหาที่เจอ (หลักฐาน)

- Log dev server: `[200] / 3045ms` · `[200] / 3024ms` → ชน `TIMEOUT_MS = 3000` → `null` → การ์ดเพลงหาย (ผู้ใช้เปิดหน้าแรกแล้วไม่เห็นเพลง)
- วัด cold fetch จากเครื่องนี้ (Node, ยังไม่มี cache): **1112 / 2735 / 2112 ms** — ใกล้ 3s มาก + overhead ครั้งแรกของ dev server = เกิน
- ระหว่างที่ยังไม่มี cache ทุก request ยิง fetch ใหม่ + รอเกือบ 3s → หน้าแรกช้าทุกครั้ง (L6 เดิม)
- หลังสำเร็จหนึ่งครั้ง cache 1 ชม. ทำงานถูก → การ์ดขึ้น

## Files

- แก้ (owner OpenCode): `src/lib/music.ts` · `tests/music.test.ts`
- ไม่แตะ: `src/pages/*.astro` (Claude) · `src/lib/profile.ts` · `src/lib/tagline.ts`

## Requirements

1. **Warm-up:** เริ่มดึงชาร์ตทันทีเมื่อ module ถูก import (ไม่ await ตอน import · ห้าม unhandled rejection) → คนแรกมีโอกาสเจอการ์ด
2. **Stale-while-revalidate:** มี cache (แม้หมดอายุ) → คืนเพลงจาก cache **ทันที** แล้วรีเฟรชเบื้องหลัง · หน้าไม่รอ Apple เลย
3. **ไม่มี cache เลย:** รอ fetch ที่กำลังวิ่งอยู่ได้ไม่เกิน **~1s** (ตั้งเป็นค่าคงที่) → เกินแล้วคืน `null` แต่ **fetch ตัวเดิมวิ่งต่อ** จนเสร็จและเติม cache ให้ request ถัดไป
4. **Single-flight:** มี fetch วิ่งได้ทีละตัว — request ที่ซ้อนกันใช้ promise เดียวกัน
5. **Backoff:** fetch ล้ม → ไม่ยิงใหม่ภายใน ~60s (ค่าคงที่) · ระหว่างนั้นใช้ cache เก่า / `null`
6. Fetch timeout (ของ Apple) ขยายเป็น ~8s ได้ เพราะหน้าไม่ได้รอมันแล้ว
7. สัญญาเดิมห้ามเปลี่ยน: `getRandomSong(): Promise<Song | null>` · ไม่ throw · ไม่เพิ่ม dependency · ไม่ใช้ key · ไม่ log ข้อมูลผู้เข้าชม
8. Test (mock `fetch` + fake timers): มี cache หมดอายุ → คืนทันทีไม่รอ fetch · ไม่มี cache + fetch ช้า → `null` ภายใน ~1s แล้ว request ถัดไปได้เพลง · request ซ้อนกัน = fetch ครั้งเดียว · ล้มแล้วไม่ยิงซ้ำภายใน backoff · test เดิมยังผ่าน
9. ต้องมีวิธี reset state ระหว่าง test (เช่น export `__resetForTest()`) — เพราะ warm-up ตอน import จะยิง fetch ใน test ด้วย ต้องไม่ยิงเน็ตจริงใน `npm test`

## Verification

- Unit / smoke: NOT_RUN — ยังไม่มีโค้ด
- Manual: หลังแก้ ให้ restart `npm run dev` แล้วเปิด `/` ครั้งแรก → ดู log ว่า `/` ไม่เกิน ~1s

## Assumptions to challenge

1. warm-up ตอน import พอ (Astro โหลด module ตอน request แรก ไม่ใช่ตอน boot) — ถ้าเห็นว่าควร warm ที่อื่น (เช่น middleware) ให้เขียนเหตุผล แต่**ห้ามแตะ `.astro`**
2. รอ 1s ตอนไม่มี cache เหมาะกว่าไม่รอเลย (ไม่รอ = request แรกไม่มีการ์ดแน่นอน)

## Request to next agent

- **Implement** ตาม Requirements ใน `src/lib/music.ts` + `tests/music.test.ts` · `npm test` + `npm run build` ผ่าน
- ปิด L6 ใน `docs/OPEN_LOOPS.md` · อัปเดต `docs/STATUS.md`
- เขียน `docs/handoffs/05b-opencode-to-claude.md` แล้ว commit

## Canonical state updated

- [x] `docs/STATUS.md`
- [x] `docs/OPEN_LOOPS.md`
- [ ] `docs/DECISIONS.md` (ไม่มี decision ใหม่)

## Single-writer note

Writer รอบถัดไปของ STATUS/OPEN_LOOPS = OpenCode (จนกว่าจะส่ง handoff กลับ)
