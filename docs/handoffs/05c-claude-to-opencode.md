# Handoff: Claude → OpenCode

Timestamp: 2026-09-25 12:20 +07:00  
Task: L7 — เพลงสุ่ม: warm-up ตอน server boot จริง + backoff เมื่อชาร์ตว่าง  
Status: NEEDS_REVIEW (สเปกพร้อม · ยังไม่มีโค้ด)

## What changed

- ไม่มีโค้ดเปลี่ยน — Claude review `562eac9` (L6) แล้วผ่าน · เหลือ 2 จุดเล็กด้านล่าง

## ปัญหาที่เจอ (หลักฐาน)

### 1. Warm-up ไม่ได้เริ่มตอน boot

Claude วัดบน build จริง (`npm run build` → `PORT=4399 node ./dist/server/entry.mjs`) เปิด server ใหม่ทุกรอบ:

```
run1 req1 1.249770s card=no    (รอ 1.5s หลัง boot แล้วค่อยยิง)
run1 req2 0.568526s card=yes
run2 req1 1.243959s card=no
run2 req2 0.212716s card=yes
immediate req 1.274781s card=no
```

- รอ 1.5s หลัง boot แล้วยิง request แรกก็ยัง `card=no` → `void refresh()` ตอน import **ไม่ได้วิ่งตอน boot**: adapter โหลด page module (และ `music.ts`) แบบ lazy ตอน request แรก warm-up จึงเริ่มพร้อม request แรกเสมอ
- ผล: คนแรกหลัง restart/deploy ไม่เห็นการ์ดแทบทุกครั้ง (cold fetch เครื่องนี้ 1.1–2.7s > `WAIT_MS` 1s)
- ข้อสังเกตในงานที่ส่งกลับ (`05b-opencode-to-claude.md` · Assumption 1) ที่ว่า "Astro โหลด module ตอน request แรกอยู่แล้ว warm-up จึงเริ่มทันทีจุดเดียวกัน" ถูก — แต่นั่นแปลว่าไม่มี head start

### 2. ชาร์ตว่างไม่เข้า backoff

- `refresh()` เมื่อ fetch สำเร็จแต่ไม่มีรายการ valid → `return null` โดย **ไม่ตั้ง** `nextAttemptAt`
- ถ้ายังไม่มี cache → ทุก request ยิง Apple ใหม่ + รอ 1s (Apple ตอบว่าง = เกิดยาก แต่พฤติกรรมไม่ตรงกับ backoff)

## Files

- แก้ได้ (owner OpenCode): `src/lib/music.ts` · `tests/music.test.ts`
- สร้างใหม่ได้ ถ้าจำเป็นสำหรับข้อ 1: `src/middleware.ts` (server-only)
- **ไม่แตะ:** `src/pages/*.astro` · `src/layouts/` · `src/lib/profile.ts` · `src/lib/tagline.ts` · `.env`
- `astro.config.mjs`: แก้ได้เฉพาะถ้าไม่มีทางอื่น และต้องเขียนเหตุผลใน handoff ส่งกลับ

## Requirements

1. **Boot warm-up:** เมื่อ `node ./dist/server/entry.mjs` เริ่ม → ดึงชาร์ตทันทีโดยไม่ต้องรอ request แรก
   - เลือกกลไกเอง (เช่น middleware, integration hook, หรือวิธีอื่น) แต่**ต้องพิสูจน์ด้วยการวัดจริง** — middleware อาจถูกโหลดแบบ lazy เหมือนกัน ให้เช็กก่อนเลือก
   - ถ้าพิสูจน์แล้วทำไม่ได้โดยไม่แตะไฟล์นอกขอบเขต → **หยุด** เขียนสิ่งที่ลองและผลลงใน handoff ส่งกลับ อย่า hack
2. **Empty chart = failure:** fetch สำเร็จแต่ 0 รายการ valid → ตั้ง backoff เหมือน error (ไม่ทับ cache เก่า)
3. สัญญาเดิมห้ามเปลี่ยน: `getRandomSong(): Promise<Song | null>` · ไม่ throw · ไม่เพิ่ม dependency · ไม่ใช้ key · `npm test` ไม่ยิงเน็ตจริง
4. Test: ชาร์ตว่าง → ไม่ยิงซ้ำภายใน `BACKOFF_MS` · test เดิม 25 ตัวยังผ่าน

## Acceptance (วัดแบบเดียวกับ Claude)

```bash
npm run build
PORT=4399 node ./dist/server/entry.mjs &   # แล้วรอ 3 วินาที
curl -s http://localhost:4399/ | grep -c "เพลงสุ่มวันนี้"   # ต้องได้ 1 ตั้งแต่ request แรก
```

- ทำซ้ำ ≥2 รอบ (restart ทุกรอบ) · ใส่ output จริงใน handoff ส่งกลับ · ปิด server หลังวัด

## Assumptions to challenge

1. รอ 3s หลัง boot พอให้ cold fetch (1.1–2.7s) เสร็จ — ถ้าเน็ตช้ากว่านั้นก็ยังคืน `null` ได้ตามปกติ ไม่ถือว่า fail
2. การ warm-up ตอน boot ไม่ทำให้ `npm run dev` หรือ `npm test` ยิงเน็ตเพิ่มแบบไม่คาดคิด

## Request to next agent

- Implement ข้อ 1–4 · `npm test` + `npm run build` ผ่าน · วัด Acceptance
- ปิด L7 ใน `docs/OPEN_LOOPS.md` · อัปเดต `docs/STATUS.md`
- เขียน `docs/handoffs/05c-opencode-to-claude.md` แล้ว commit

## Canonical state updated

- [x] `docs/STATUS.md`
- [x] `docs/OPEN_LOOPS.md`
- [ ] `docs/DECISIONS.md` (ไม่มี decision ใหม่)

## Single-writer note

Writer รอบถัดไปของ STATUS/OPEN_LOOPS = OpenCode (จนกว่าจะส่ง handoff กลับ)
