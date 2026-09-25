# Handoff: Claude → OpenCode

Timestamp: 2026-09-25 11:49 +07:00  
Task: L3 — การ์ด "เพลงสุ่มวันนี้" (ฝั่ง server: ดึง + cache + fallback)  
Status: NEEDS_REVIEW (สเปกพร้อม · ยังไม่มีโค้ด)

## What changed

- Claude เช็ก endpoint แล้ว (2026-09-25): ใช้ได้ ไม่ต้องใช้ key
  - URL: `https://rss.marketingtools.apple.com/api/v2/th/music/most-played/25/songs.json`
  - host เดิม `rss.applemarketingtools.com` ตอบ **301** มาที่ host ด้านบน → ใช้ host ใหม่ตรง ๆ
  - ตอบ 200 `application/json` · `feed.results` 25 รายการ
  - fields ต่อเพลง: `name`, `artistName`, `url` (หน้าเพลงบน music.apple.com), `artworkUrl100`, `genres`, `releaseDate`, `id`
- ที่มาของความต้องการ: `docs/PROFILE.md` → `## Brainstorm` (เพลงสุ่ม · ลิงก์ "ฟังต่อ")

## Files

- ใหม่ (owner OpenCode): `src/lib/music.ts` + test `tests/music.test.ts`
- ไม่แตะ: `src/pages/*.astro`, `src/layouts/` (Claude ทำการ์ดเอง)

## Contract ที่ frontend จะเรียก

```ts
export type Song = { name: string; artist: string; url: string };
export async function getRandomSong(): Promise<Song | null>;
```

- เรียกจาก frontmatter ของหน้า `.astro` ฝั่ง server (SSR) — **ยังไม่ต้องมี** `src/pages/api/*` (ปุ่ม "สุ่มใหม่" เป็น Nice ค่อยทำ route ทีหลัง)
- **ห้าม throw** — ทุกความผิดพลาด (timeout, non-200, JSON พัง, results ว่าง) → คืน `null` แล้ว UI ซ่อนการ์ด
- สุ่มหนึ่งเพลงจากลิสต์ที่ cache ไว้ทุกครั้งที่เรียก

## Requirements

1. **Cache ระดับ module** TTL 1 ชั่วโมง — ไม่ยิง Apple ทุก request
2. ถ้ารีเฟรชล้มเหลวแต่มี cache เก่า → ใช้ cache เก่าต่อ (stale-on-error)
3. **Timeout 3 วินาที** (`AbortSignal.timeout`) — หน้าเว็บห้ามค้างเพราะ Apple ช้า
4. ใช้ `fetch` ของ Node 22 — **ไม่เพิ่ม dependency**
5. Validate: รับเฉพาะรายการที่ `name`/`artistName` เป็น string ไม่ว่าง และ `url` ขึ้นต้น `https://music.apple.com/`
6. ไม่ใช้ key · ไม่เพิ่มอะไรใน `.env` · ไม่ log ข้อมูลผู้เข้าชม
7. Test ต้อง mock `fetch` (ห้ามยิงเน็ตจริงใน `npm test`/CI): ปกติ · non-200 → null · timeout → null · stale-on-error · cache ไม่ยิงซ้ำภายใน TTL

## Verification

- Unit / smoke: NOT_RUN — ยังไม่มีโค้ด
- Labs (`npm run test:labs`): N/A
- Manual / localhost: `curl -sL` endpoint ด้านบน → 200 JSON (Claude รันแล้ว)

## Assumptions to challenge

1. ไม่คืน `artworkUrl100` — โหลดรูปจาก `mzstatic.com` = request ไปบุคคลที่สามจาก browser ผู้เข้าชม · ธีมมินิมอลอาจไม่ต้องใช้รูป ถ้าเห็นต่างให้เขียนเหตุผล
2. TTL 1 ชม. พอ — ชาร์ต `updated` เปลี่ยนวันละไม่กี่ครั้ง
3. เรียกใน SSR พอ ยังไม่ต้องมี API route

## Request to next agent

- **Implement** `src/lib/music.ts` + `tests/music.test.ts` ตามสัญญาด้านบน · ให้ `npm test` + `npm run build` ผ่าน
- **อย่าแตะ UI** (`.astro`, layouts, styles) · อย่าแก้ `src/lib/profile.ts` (L2 เป็นของ Claude)
- เสร็จแล้วเขียน `docs/handoffs/05-opencode-to-claude.md` แล้ว commit

## Canonical state updated

- [x] `docs/STATUS.md`
- [x] `docs/OPEN_LOOPS.md`
- [ ] `docs/DECISIONS.md` (ยังไม่มี — การใช้ Apple Music RSS ยังเป็น proposed)
- [ ] อื่น ๆ:

## Single-writer note

Writer รอบถัดไปของ STATUS/OPEN_LOOPS = OpenCode (จนกว่าจะส่ง handoff กลับ)
