# Handoff: OpenCode → Claude

Timestamp: 2026-09-25 12:00 +07:00  
Task: L3 — server ฝั่ง "เพลงสุ่มวันนี้" (ดึง + cache + fallback)  
Status: READY_FOR_UI (โค้ด + test เขียว · รอผูกหน้า)

## What changed

- ใหม่: `src/lib/music.ts` — `getRandomSong(): Promise<Song | null>` ตามสัญญาใน `05-claude-to-opencode.md`
- ใหม่: `tests/music.test.ts` — 8 test, mock `fetch` ทั้งหมด (ไม่ยิงเน็ตจริงใน `npm test`/CI)
- **ไม่แตะ** `src/pages/*.astro`, `src/layouts/`, `src/lib/profile.ts` (ตามขอบเขตใน handoff เดิม)

## Contract (ยืนยันตรงตามสเปก)

```ts
export type Song = { name: string; artist: string; url: string };
export async function getRandomSong(): Promise<Song | null>;
```

- เรียกจาก frontmatter ของ `.astro` ฝั่ง SSR ได้เลย · ไม่ throw · พัง = `null` → UI ซ่อนการ์ด
- สุ่มหนึ่งเพลงจากลิสต์ cache ทุกครั้งที่เรียก (สุ่มใหม่ทุก request ภายใน TTL เดียวกัน)

## How it works (สั้น)

1. **Cache ระดับ module** TTL 1 ชม. — ยิง Apple ครั้งเดียวต่อชั่วโมงต่อ process
2. **Stale-on-error** — รีเฟรชล้ม (timeout / non-200 / JSON พัง) แต่มี cache เก่า → ใช้ cache เก่าต่อ
3. **Timeout 3s** ผ่าน `AbortSignal.timeout` — หน้าเว็บไม่ค้างเพราะ Apple ช้า
4. **Validate** เฉพาะรายการที่ `name`/`artistName` เป็น string ไม่ว่าง + `url` ขึ้นต้น `https://music.apple.com/` — ตัดรายการไม่ผ่านออก
5. **กรณีเส้นเทา (ตีความจากสเปก):** ถ้าดึงสำเร็จแต่ results ว่าง/ไม่มีรายการ valid → ไม่ทับ cache · ถ้ามีของเก่าใช้ของเก่า, ไม่มี → `null` (สอดคล้องทั้ง "results ว่าง → null" และ stale-on-error)
6. ไม่ใช้ key · ไม่แตะ `.env` · ไม่ log อะไร · ไม่เพิ่ม dependency (fetch ของ Node 22)

## Verification

- `npm test`: **PASS** — 4 files / 15 tests (รวม music 8 tests: ปกติ · non-200 → null · timeout → null · JSON พัง → null · results ว่าง → null · validation กรองของไม่ผ่าน · stale-on-error · ไม่ยิงซ้ำใน TTL)
- `npm run build`: **PASS** (Astro SSR build สำเร็จ)
- Labs (`npm run test:labs`): N/A (ไม่เกี่ยวกับ API/SQLite ของ Lab 05)
- Endpoint จริง: Claude เช็กแล้ว 200 ใน handoff เดิม (ไม่ re-verify ใน test เพื่อไม่ยิงเน็ตจาก CI)

## Response to "Assumptions to challenge"

1. **ไม่คืน `artworkUrl100` — เห็นด้วยกับต้นทาง** · เหตุผลเพิ่ม: โหลดรูปจาก `mzstatic.com` จาก browser ผู้เข้าชม = third-party request + ปัญหา fingerprinting โดยไม่จำเป็น ธีมมินิมอลเน้นตัวหนังสือพอ · ถ้าอนาคตต้องการรูป ให้ proxy ผ่าน route ของเราแทน hot-link ตรง
2. **TTL 1 ชม. — พอ** · ชาร์ตเปลี่ยนวันละไม่กี่ครั้ง + stale-on-error คุ้มค่าแล้ว
3. **SSR อย่างเดียว — ตกลง** · ปุ่ม "สุ่มใหม่" (Nice) ค่อยเพิ่ม `src/pages/api/music/random.ts` ทีหลัง (แนวเดียวกับ route อื่น: helper ใน lib + error → 400/500)

## Request to next agent

- Claude: ผูกการ์ดบนหน้าแรก — เรียก `getRandomSong()` ใน frontmatter · `null` = ซ่อนการ์ดทั้งก้อน (ห้ามแสดง placeholder ว่าง)
- แก้บั๊ก parser ใน `src/lib/profile.ts` ยังเป็น L2 ของ Claude (ยังไม่แตะ)

## Canonical state updated

- [x] `docs/STATUS.md` (writer: OpenCode รอบนี้)
- [x] `docs/OPEN_LOOPS.md` (L3 ปิด → ย้ายไป "ปิดแล้ว")
- [ ] `docs/DECISIONS.md` — ยังไม่มี · Apple Music RSS ยัง proposed (L5 · รอ Lab 02 debate)

## Single-writer note

Writer รอบถัดไปของ STATUS/OPEN_LOOPS = Claude (หลัง commit นี้)