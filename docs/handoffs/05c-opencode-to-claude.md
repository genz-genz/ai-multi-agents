# Handoff: OpenCode → Claude

Timestamp: 2026-09-25 12:30 +07:00  
Task: L7 — boot warm-up + backoff ชาร์ตว่าง  
Status: PARTIAL_DONE (ข้อ 2 เสร็จ + test เขียว · **ข้อ 1 ทำไม่ได้ภายในขอบเขต → หยุดตามเงื่อนไข handoff**)

## What changed

- `src/lib/music.ts` — **ข้อ 2 เสร็จ:** fetch สำเร็จแต่ 0 รายการ valid → ตั้ง `nextAttemptAt = now + BACKOFF_MS` (60s) เหมือน error · ไม่ทับ cache เก่า (รับช่วง stale-on-error ต่อ)
- `tests/music.test.ts` — +2 tests (14 music tests รวม): ชาร์ตว่าง → ไม่ยิงซ้ำใน `BACKOFF_MS` แล้วยิงใหม่ได้หลังหมด backoff · ชาร์ตว่างไม่ล้าง cache เก่า (คืน stale ทันที + backoff)
- สัญญาเดิมไม่เปลี่ยน · ไม่เพิ่ม dependency · `npm test` **26/26** · `npm run build` **ผ่าน**
- `src/middleware.ts` — **สร้างแล้วพิสูจน์แล้วลบ** (ดูหลักฐานข้อ 1 ด้านล่าง)
- `astro.config.mjs` — **ลองแก้แล้ว revert กลับเป็นของเดิมทั้งไฟล์** (ดูหลักฐานข้อ 3)

## ข้อ 1 (Boot warm-up): สิ่งที่ลอง + หลักฐาน — ทำไม่ได้ภายในขอบเขต

### ลองครั้งที่ 1 — `src/middleware.ts` เรียก `warmUpChart()` (สร้างไฟล์ใหม่)

- วิเคราะห์ build output: `dist/server/entry.mjs` line 2194 — `const middleware = await getMiddleware(state.manifest)` อยู่**ใน request handler** (memo factory ที่ line 2120–2129 ถูกเรียกเฉพาะจากจุดนั้น) → **middleware โหลดแบบ lazy ตอน request แรก** ไม่ใช่ตอน boot · static imports บนสุดของ entry.mjs เป็น astro runtime + node builtins เท่านั้น ไม่มี app chunk
- วัดจริง (build → `PORT=4399 node ./dist/server/entry.mjs` → รอ 3s → request):

```
run1 req1 1.282561s card=0 link=0 | req2 0.226857s card=2 link=1
run2 req1 1.270250s card=0 link=0 | req2 1.143590s card=2 link=1
```

  (`card` = จำนวน "เพลงสุ่มวันนี้" · `link` = จำนวน `music.apple.com`)
- **ตรวจสอบตรรกะ:** ถ้า middleware โหลดตอน boot จริง req1 ต้องมีการ์ด เพราะ warm-up ยิงที่ boot และ cold fetch (1.1–2.7s) เสร็จก่อนครบ 3s ทุกรอบ · แต่ req1 `card=0` 2/2 รอบ + req2 มีการ์ด → warm-up เริ่มพร้อม request แรกเสมอ (ตรงกับการวัดของ Claude ทุกตัวเลข) → middleware **ไม่ช่วย** → ลบไฟล์ทิ้ง (ไม่เก็บ dead code)

### ลองครั้งที่ 2 — integration hook ผ่าน `astro.config.mjs`

- ตรวจ `@astrojs/node/dist/standalone.js`: prod boot = `standalone(app, ...)` เรียก `createServer(...).listen()` ตรง ๆ — **ไม่มี hook จุดใด** · hook ของ integration ที่เกี่ยวกับ server (`astro:server:start`) รันเฉพาะ dev · `astro:build:done` รันตอน build ไม่ใช่ตอน boot
- ตรวจ `node_modules/astro/dist` ทั้งหมด: **ไม่มี instrumentation / boot-hook API** (grep "instrumentation" = 0 match)

### ลองครั้งที่ 3 — `astro.config.mjs` vite `inlineDynamicImports: true` (แตะ config ครั้งเดียว)

- หลักการ: inline app modules ทั้งหมดเข้า `entry.mjs` → import-time warm-up จะรันตอน boot
- ผล: rolldown **reject** — `[INVALID_OPTION] Invalid value "false" for option "output.codeSplitting" - multiple inputs are not supported when "output.codeSplitting" is false` (SSR build มี multiple inputs) → build พัง → **revert แล้ว** (`astro.config.mjs` ตอนนี้ = ของเดิมทุกบรรทัด, commit พร้อมกับ handoff นี้)

### สรุปข้อ 1

ไม่มีกลไกภายในขอบเขตที่รันโค้ดตอน `node ./dist/server/entry.mjs` boot ได้ — ทุก app module (pages + middleware) โหลด lazy ตอน request แรก และ astro/adapter ไม่มี boot hook สำหรับ prod จึงหยุดตามเงื่อนไข (ไม่ hack dist)

## Verification (ข้อ 2)

- `npm test`: **PASS 26/26** (music 14 · เดิมทุกตัวยังผ่าน · ไม่ยิงเน็ตจริง)
- `npm run build`: **PASS**
- Manual วัดจริง (โปรโตคอลเดียวกับ Claude): boot → รอ 3s → req1 → req2 ทำ 2 รอบ restart ใหม่ทุกรอบ:

```
run1 req1 1.282561s card=0 link=0 | req2 0.226857s card=2 link=1
run2 req1 1.270250s card=0 link=0 | req2 1.143590s card=2 link=1
```

  (หมายเหตุ: รอบวัดแรกของผม regex ภาษาไทยพังเพราะ Windows PowerShell อ่าน .ps1 BOM-less เป็น ANSI — แก้โดยสร้าง pattern จาก Unicode code points แล้ววัดใหม่ ตัวเลขข้างบนคือรอบที่ถูกต้อง)
- ปิด server หลังวัดทุกรอบแล้ว

## ทางเลือกต่อไป (ยังไม่ทำ — ต้องตัดสินใจก่อน จึงไม่แตะ)

1. **ยอมรับพฤติกรรมปัจจุบัน** — คนแรกหลัง restart เจอหน้าเร็ว (cap 1s) ไม่มีการ์ด · คนที่สองเป็นต้นไปมีการ์ด (เกิดขึ้นจริงตามการวัด)
2. **Warm curl หลัง deploy** — ฝั่ง deploy/webhook ยิง `/` หนึ่งครั้งหลัง server พร้อม (อยู่นอก repo scope · เกี่ยวกับ `.env`/webhook ซึ่งผมห้ามแตะ) — ต้องเป็น decision ของ human
3. **Persist ชาร์ตลง disk/sqlite ข้าม restart** — request แรกหลัง boot เสิร์ฟจาก cache บนดิสก์ได้ทันที + SWR รีเฟรช (ทำใน `music.ts` ได้ · แต่เปลี่ยนพฤติกรรมการเก็บข้อมูล = ควรเข้า debate เป็น D-id ก่อน)
4. `NODE_OPTIONS` preload script — ออกนอก repo/scope

## Request to next agent

- ตัดสินใจเลือกทางเลือกข้อ 1–4 ด้านบน (หรือขอให้ผมทำต่อถ้า scope เปลี่ยน) — ถ้าเลือก 3 แนะนำให้เข้า debate → `DECISIONS.md` ก่อน implement
- ข้อ 2 (backoff ชาร์ตว่าง) เสร็จแล้วอย่าเพิ่มงานซ้ำ

## Canonical state updated

- [x] `docs/STATUS.md` (writer: OpenCode รอบนี้)
- [x] `docs/OPEN_LOOPS.md` (L7 ยังเปิด — ข้อ 2 เสร็จ · ข้อ 1 บล็อกที่แพลตฟอร์ม รอ decision)
- [ ] `docs/DECISIONS.md` (ทางเลือกใหม่ถ้าเลือกข้อ 3)

## Single-writer note

Writer รอบถัดไปของ STATUS/OPEN_LOOPS = Claude (หลัง commit นี้)