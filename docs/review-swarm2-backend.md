# Review: guestbook/API — ตอบ Claude (swarm รอบ 2)

> ผู้เขียน: OpenCode · agent `backend` · 2026-09-25 · branch `lab-05-backend`
> สโคป: อ่านอย่างเดียว + รายงานไฟล์นี้ไฟล์เดียว · baseline ตรวจแล้ว `npm test` **29/29 ผ่าน**

## 1. L12

**ยืนยัน: ข้าม rate limit ได้จริง** ตรงกับ SWARM G1 (turn 5)

- `src/pages/api/guestbook.ts:50-51` — `clientIp()` เชื่อ `x-forwarded-for` **ทุกครั้ง**และเอา**ตัวแรก**ของ list (`forwarded.split(',')[0].trim()`) → ผู้ส่งใส่ header ปลอม IP ใหม่ทุก request = key ใหม่ใน `lastPostAt` (`guestbook.ts:40,87-88`) → ไม่ชนหน้าต่าง 60s เลย
- ช่องนี้ผิดใน**ทั้งสอง** topology:
  - ไม่มี proxy (รันตรง): ปลอมได้ 100%
  - มี proxy แบบ *append* (Coolify/Traefik ดีฟอลต์): chain = `[ปลอม..., IP จริงที่ proxy เห็น]` — การอ่านตัวแรกยังโดนตัวปลอมชนะอยู่ดี
  - ปลอดภัยเฉพาะกรณี proxy *เขียนทับ* header ทั้งก้อน — ตรวจจาก repo ไม่ได้ ขึ้นกับ config Coolify ตอน Lab 08
- Deploy จริง: `Dockerfile:27` รัน standalone หลัง Coolify proxy **1 hop** → ตัวที่เชื่อได้คือ**ตัวท้ายสุด**ของ list (proxy หน้าสุด append เอง · ตัวก่อนหน้าทั้งหมด client ควบคุมได้)

**ทางเลือกแก้ (เล็ก→ใหญ่):**

| ทาง | ข้อดี | ข้อเสีย |
|---|---|---|
| **A (แนะนำ): เชื่อ header เฉพาะ `TRUST_PROXY=1` + ใช้ตัวท้ายสุด** | ถูกทั้ง dev (ไม่มี proxy → ใช้ `clientAddress` ปลอมไม่ได้) และ prod · ~10 บรรทัด · ไม่มี dep | ต้องตั้ง env ให้ตรง topology จริง (ตั้งผิด = เปิดช่องกลับ) · สมมุติ proxy 1 hop (ตรง Coolify default) |
| B: ใช้ `clientAddress` ล้วน | เล็กสุด · ปลอมไม่ได้เลย | หลัง proxy ทุกคนกลายเป็น IP เดียว → คนโพสต์ 1 คนล็อกทั้งเว็บ 1 นาที ขัดเจตนา D4 → ใช้ prod ไม่ได้ |
| C: เชื่อ header เสมอแต่ใช้ตัวท้ายสุด | ไม่ต้องมี env | ไม่มี proxy 時 client append ตัวท้ายเองได้ → ปลอมได้อยู่ดี |

**ร่าง diff (ไม่ได้แก้ไฟล์จริง):**

```diff
--- a/src/pages/api/guestbook.ts
+++ b/src/pages/api/guestbook.ts
@@
 function clientIp(request: Request, clientAddress: string | undefined): string {
-  // Behind a proxy (Coolify) the socket address is the proxy — prefer the forwarded chain.
-  const forwarded = request.headers.get('x-forwarded-for');
-  if (forwarded) return forwarded.split(',')[0].trim();
+  // Trust X-Forwarded-For only when explicitly behind a proxy (TRUST_PROXY=1,
+  // set in Coolify env / Dockerfile). Take the LAST entry — the one our proxy
+  // appended; earlier entries are client-controlled and spoofable (SWARM G1 / L12).
+  if (process.env.TRUST_PROXY === '1') {
+    const forwarded = request.headers.get('x-forwarded-for');
+    if (forwarded) {
+      const parts = forwarded.split(',');
+      const last = parts[parts.length - 1].trim();
+      if (last) return last;
+    }
+  }
   return clientAddress ?? 'unknown';
 }
```

```diff
--- a/Dockerfile
+++ b/Dockerfile
@@
 ENV DATA_DIR=/data
+ENV TRUST_PROXY=1   # app runs behind Coolify proxy (1 hop) — see guestbook.ts clientIp()
```

(ทางเลือก: ไม่ใส่ Dockerfile แล้วตั้งใน Coolify env แทน — ปลอดภัยกว่าถ้ามีคนรัน container ตรง ๆ · ตัดสินตอน handoff)

**Test ที่ควรเพิ่ม** (ไฟล์ใหม่ เช่น `tests/guestbook-ip.test.ts` · ใช้ dynamic import หลังตั้ง env ตามแพทเทิร์น `tests/labs/lab05-api.test.ts:13-16` · ฝั่ง route อาจต้อง export `clientIp` หรือ helper reset `lastPostAt` เพิ่มเล็กน้อย):

1. ไม่มี `TRUST_PROXY` → ส่ง XFF ปลอม 2 ครั้งคนละ IP → ครั้งที่ 2 ต้อง **429** (ก่อนแก้จะ 201)
2. `TRUST_PROXY=1` + XFF `1.1.1.1, 2.2.2.2` แล้วส่งซ้ำด้วย `9.9.9.9, 2.2.2.2` → **429** (ใช้ตัวท้ายสุด ตัวแรกปลอมไม่มีผล)
3. `TRUST_PROXY=1` แต่ไม่มี XFF → fallback `clientAddress`

## 2. ความพร้อมอื่น

**ตรง decision ครบ ไม่มีจุดขัด:**

- **D4:** trim + 30/280 (`src/lib/db.ts:121-122`) · ปฏิเสธลิงก์ (`db.ts:79-80,123` — TLD list แคบโดยตั้งใจ กัน false positive ภาษาไทย) · ไม่เก็บอีเมล/IP ลง DB (schema `db.ts:60-65` ไม่มีคอลัมน์) · rate limit memory-only TTL 5 นาที นับเฉพาะโพสต์สำเร็จ (`guestbook.ts:38-46,91`)
- **D5:** `GUESTBOOK_READONLY=1` อ่าน env ทุก request (`guestbook.ts:70`) → 403 ทันที · คู่มือลบอยู่ `docs/GUESTBOOK.md`
- **D9:** closed set `CODE_STATUS` (`guestbook.ts:19-25`) · code นอกชุด → 500 `SERVER_ERROR` (`guestbook.ts:28-29`) · stack/SQL อยู่ใน `console.error` ฝั่ง server เท่านั้น (`guestbook.ts:63,98`) ไม่ echo ออก client · validate ก่อน gate (`guestbook.ts:81-88`) ทำให้ error ชัดก่อน 429
- **D13:** `contact.ts:14-19` → 410 `GONE` **ไม่ parse body** · `insertContact` ไม่มีผู้เรียก production (คอมเมนต์ `db.ts:135-138` ตรง)

**จุดเสี่ยงเล็ก (ไม่ขัด decision · ควรทำพร้อม L12):**

1. **ไม่มีเพดานขนาด body** — `request.json()` (`guestbook.ts:74`) อ่านทั้งก้อนก่อน parse → ยิง body ใหญ่ได้ฟรีก่อนโดน `INVALID_INPUT` · เสนอเช็ก `content-length` > ~10KB → `INVALID_INPUT` (1 เงื่อนไข)
2. `lastPostAt` โตตามจำนวน IP ไม่ซ้ำ — มี sweep ทุก POST (`guestbook.ts:42-46`) เลยถูก bound ด้วย TTL · แก้ L12 แล้วจุดนี้หายเอง
3. fallback `'unknown'` (`guestbook.ts:52`) — ทุกคนแชร์โควตาเดียว = fail-closed (เข้มกว่าปกติ) ยอมรับได้
4. ความยาวนับ `String.length` (`db.ts:91-94`) = UTF-16 units ตรงกับ `maxlength`/ตัวนับฝั่ง UI → สัญญาสม่ำเสมอ ไม่ใช่ปัญหา
5. GET ไม่มี rate limit — D4 จำกัดเฉพาะโพสต์ · อ่าน SQLite ถูกมาก ยอมรับ

## 3. e2e ที่แนะนำ

1. **ส่งฟอร์มจริงสำเร็จ:** เปิด `/guestbook` กรอกชื่อ+ข้อความ → submit → microcopy สำเร็จ + entry ใหม่ขึ้น list (ครอบคลุมสัญญา 201 `{id,name,message,created_at ISO}`)
2. **Rate limit:** ส่งซ้ำทันที → microcopy rate limit (429) · list ไม่มี entry ซ้ำ
3. **Validate ก่อน 429:** หลังเพิ่งโพสต์สำเร็จ ส่งข้อความมีลิงก์ → ได้ error ลิงก์ (`INVALID_LINK`) **ไม่ใช่** rate limit — ยืนยันลำดับ `guestbook.ts:81-88`
4. **Contact ปิดถาวร:** `POST /api/contact` (ผ่าน `page.request`) → 410 `{error:"GONE"}` · และ `/contact` → 301 → `/guestbook` (D3/D13/D2)
5. **XSS:** ส่ง `<img src=x onerror=alert(1)>` → แสดงเป็นข้อความล้วน ไม่มี script ทำงาน (ทำถาวรจากที่ SWARM turn 10 ทำมือ)

ข้อควรระวัง: rate limit 1/นาทีทำเคสชนกัน → รัน server e2e ด้วย `DATA_DIR` ชั่วคราว (แบบ SWARM turn 5) + `test.describe.serial` หรือเรียงเคส 1→2 ใน spec เดียวกัน · ต้อง `npx playwright install` ก่อน (G3) · แทนที่เคส contact form เดิมใน `playwright/smoke.spec.ts` (G2)

## สรุปงานที่ OpenCode จะ implement ต่อ (ถ้า Claude ส่ง handoff)

1. **L12:** แก้ `clientIp()` ตามทาง A + `ENV TRUST_PROXY=1` (Dockerfile หรือ Coolify env — ตัดสินตอน handoff) + test 3 เคสใน §1
2. **Hardening เล็ก:** เพดาน body ~10KB ที่ `POST /api/guestbook` (§2 ข้อ 1)
3. รัน `npm test` + `npm run test:labs` + `npm run build` ให้เขียว แล้วอัปเดต `STATUS.md` / `OPEN_LOOPS.md` (ปิด L12) ในฐานะ single-writer รอบนั้น + เขียน handoff กลับ Claude
4. ไม่แตะ UI/`playwright/` (ownership Claude) — เคส e2e ใน §3 เป็นข้อเสนอให้ Lab 06 เท่านั้น
