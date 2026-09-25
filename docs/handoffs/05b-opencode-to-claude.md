# Handoff: OpenCode → Claude

Timestamp: 2026-09-25 12:20 +07:00  
Task: L6 — หน้าแรกไม่รอ Apple + การ์ดขึ้นตั้งแต่คนแรก  
Status: DONE_VERIFIED (โค้ด + test เขียว + วัดผล dev server จริง)

## What changed

- แก้ `src/lib/music.ts` ตาม Requirements ครบ 9 ข้อ (สัญญาเดิมไม่เปลี่ยน: `getRandomSong(): Promise<Song | null>` · ไม่ throw · ไม่เพิ่ม dependency)
- ขยาย `tests/music.test.ts` 13 tests (เดิม 8 → 13) — mock `fetch` + fake timers ทั้งหมด ไม่ยิงเน็ตจริง
- **ไม่แตะ** `src/pages/*.astro` · `src/lib/profile.ts` · `src/lib/tagline.ts` (ตามขอบเขต)

## กลไกใหม่ใน `src/lib/music.ts`

| กลไก | ค่าคงที่ | พฤติกรรม |
|---|---|---|
| Warm-up | — | เริ่มดึงชาร์ตทันทีตอน module ถูก import (`void refresh()` · refresh ไม่ reject = ไม่มี unhandled rejection) |
| Stale-while-revalidate | — | มี cache แม้หมดอายุ → คืนเพลงจาก cache **ทันที** + รีเฟรชเบื้องหลัง |
| Cold-start wait | `WAIT_MS = 1000` | ไม่มี cache → รอ fetch ที่กำลังวิ่ง ≤1s เกินคืน `null` แต่ fetch ตัวเดิมวิ่งต่อจนเติม cache |
| Single-flight | — | มี `inFlight` promise เดียว — request ซ้อนกันใช้ promise ร่วมกัน |
| Backoff | `BACKOFF_MS = 60_000` | fetch ล้ม → ไม่ยิงใหม่ใน 60s · ระหว่างนั้นใช้ cache เก่า / `null` |
| Fetch timeout | `TIMEOUT_MS = 8000` | ขยายจาก 3s → 8s เพราะหน้าไม่รอแล้ว (เดิม cold fetch 1112–2735ms ชน 3s เกือบทุกครั้ง) |
| TTL cache | `TTL_MS = 1 ชม.` | เดิม ไม่เปลี่ยน |

- **Guard ต่อ state reset:** ใช้ `generation` counter — callback ของ fetch เก่าจะไม่เขียน cache ทับหลัง `__resetForTest()` (ป้องกัน warm-up ตอน import มาเซ็ต cache หลัง test reset)
- **Test reset:** `__resetForTest()` (export ต่อสาธารณะเพื่อ test) — ล้าง cache/inFlight/backoff · ทุก test เริ่ม cold ผ่าน helper `loadFresh()` ที่ settle warm-up ก่อนแล้ว reset + `mockClear`

## Verification

- `npm test`: **PASS** — 5 files / **25 tests** (music 13: SWR คืนทันทีไม่รอ fetch · cold start `null` ภายใน ~1s แล้ว request ถัดไปได้เพลงโดยไม่ยิง fetch ใหม่ · single-flight fetch ครั้งเดียว · backoff ไม่ยิงซ้ำใน 60s แล้วยิงใหม่ได้ · warm-up ตอน import · test เดิมทุกตัวยังอยู่และผ่าน)
- `npm run build`: **PASS**
- **Manual (dev server จริง):** restart `npm run dev` แล้วเปิด `/` ครั้งแรก
  - เดิม: `[200] / 3045ms` · `[200] / 3024ms` (ชน timeout 3s → การ์ดหาย)
  - หลังแก้: `[200] / 1067ms` · `[200] / 214ms` · `[200] / 2ms` — request แรกใช้เวลาเกือบเท่า `WAIT_MS` (1s cap ทำงาน) · และ **การ์ดมีลิงก์ `music.apple.com` แสดงจริง** (ตรวจจาก HTML ตอบกลับ)
  - เศษ ~67ms เกินจาก 1s = render หน้าเอง ไม่ใช่การรอ Apple

## ตอบ Assumptions to challenge

1. **Warm-up ตอน import — ตกลง** ไม่แตะ middleware เพราะ (a) Astro โหลด module ตอน request แรกอยู่แล้ว warm-up จึงเริ่มทันทีจุดเดียวกัน (b) ห้ามแตะ middleware ก็เป็นขอบเขตที่ถูกแล้ว (c) ถ้าอนาคตย้าย warm-up ไปจุด boot จริง ให้เรียก `refresh()`-equivalent แค่ที่เดียวพอ — กลไก single-flight ทำให้ซ้ำได้ปลอดภัย
2. **รอ 1s ตอนไม่มี cache — เห็นด้วย** วัดผลจริง: คนแรกเจอการ์ดได้ถ้า Apple ตอบ <1s (เกิดขึ้นจริงใน dev ครั้งนี้) ถ้าไม่เจอก็ได้หน้าเร็ว (1s cap) และคนถัดไปได้การ์ดแน่นอน

## Request to next agent

- ไม่มีงาน UI เพิ่ม — การ์ดใน `index.astro` ใช้สัญญาเดิม (`null` = ซ่อนการ์ด) ทำงานต่อได้ทันทีไม่ต้องแก้
- ถ้าเจอ `/` ช้าอีกให้ดู log ก่อน — ถ้าเกิน ~1.2s แสดงว่าไม่ใช่ฝั่ง lib นี้ (cap อยู่ที่ 1000ms)
- L5 (debate → DECISIONS.md) ยังเปิดอยู่ฝั่ง Claude

## Canonical state updated

- [x] `docs/STATUS.md` (writer: OpenCode รอบนี้)
- [x] `docs/OPEN_LOOPS.md` (L6 ปิด → ย้ายไป "ปิดแล้ว")
- [ ] `docs/DECISIONS.md` (ไม่มี decision ใหม่)

## Single-writer note

Writer รอบถัดไปของ STATUS/OPEN_LOOPS = Claude (หลัง commit นี้)