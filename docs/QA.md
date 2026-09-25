# QA — Personal Site

> Lab 06


## E2E Playwright

- วันที่: 2026-09-25 15:57 +07:00 · ผู้ทดสอบ: Claude ผ่าน **Playwright MCP** (Chromium) · viewport 1280×800
- Target: `npm run dev` → `http://localhost:4321` (`PORT=4321` ใน `.env`) · branch `lab-04-frontend` @ `1932d35`
- ข้อมูลทดสอบ: ชื่อเล่น `demo` เท่านั้น · ไม่มีอีเมล/ข้อมูลจริง
- **ต่างจากสคริปต์ทดสอบเดิม:** ไม่มีหน้า Interests/Contact แล้ว (D2, D3) → ตรวจว่า redirect ถูกที่และไม่ 404 · ไม่มีฟอร์ม Contact → ตรวจว่า `/api/contact` ไม่รับข้อมูล (410)

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | เปิด `/` | ชื่อ + headline จาก PROFILE | ✅ PASS · `title` = "12-Patana · Hello world" · ชื่อ `12-Patana` · h1 `Hello world` · tagline "ยังไม่รู้จะไปไหน ขอฟังเพลงก่อน" · ประโยคสุ่ม "ครึ่งวันแรกนั่งเฉย ๆ ครึ่งวันหลังฟังเพลง" · เมนู หน้าแรก/รู้จักกัน/ทักทาย |
| 2 | เปิด `/about` | 200 · Bio + Interests | ✅ PASS · 200 · h1 "รู้จักกัน" · Interests 3 ชิป (ฟังเพลง · นั่งเฉย ๆ · ทำตัวเหมือนยุ่ง) |
| 3 | เปิด `/interests` | ไม่ 404 | ✅ PASS · **301** → `/about` (200) |
| 4 | เปิด `/contact` | ไม่ 404 | ✅ PASS · **301** → `/guestbook` (200) |
| 5 | เปิด `/nope-e2e` | 404 (ตรวจว่า 404 ยังทำงาน) | ✅ PASS · 404 |
| 6 | Guestbook: ส่ง `demo` / "สวัสดีจากการทดสอบ E2E" | success | ✅ PASS · "ได้รับแล้ว ขอบคุณที่แวะมาทัก 👋" (สีเขียว) · คำทักใหม่ขึ้นบนสุดทันที · ตัวนับกลับเป็น 0/280 |
| 7 | Guestbook: ส่งซ้ำภายใน 1 นาที | error ที่คาด: rate limit | ✅ PASS · "ทักถี่ไปนิด พักสักครู่แล้วลองใหม่นะ" (429 `RATE_LIMITED`) |
| 8 | Guestbook: ข้อความมี `https://example.com` | error ที่คาด: ลิงก์ | ✅ PASS · UI กันก่อนส่ง "มีลิงก์อยู่ในข้อความ ลบออกแล้วส่งใหม่ได้เลย" |
| 9 | API ตรง: `POST /api/guestbook` "visit abc.com now" | 400 `INVALID_LINK` (server กันโดเมนที่ UI ไม่จับ) | ✅ PASS · 400 `{"error":"INVALID_LINK"}` |
| 10 | API ตรง: `POST /api/guestbook` ชื่อ/ข้อความว่าง | 400 `INVALID_INPUT` | ✅ PASS · 400 `{"error":"INVALID_INPUT"}` |
| 11 | API ตรง: `POST /api/contact` พร้อมชื่อ+อีเมล demo | ไม่รับข้อมูล (D3) | ✅ PASS · **410** `{"error":"GONE"}` · error เป็นรหัสสั้น ไม่มีข้อความเทคนิค (D9) |
| 12 | `GET /api/guestbook` | 200 + รายการ | ✅ PASS · 200 · 2 รายการ |
| 13 | Screenshot | ≥ 2 หน้า ใน `docs/screenshots/` | ✅ 4 ไฟล์ (ด้านล่าง) |

### Screenshots

- `docs/screenshots/home.png` — หน้าแรก (full page)
- `docs/screenshots/about.png` — รู้จักกัน (มาจาก `/interests` → redirect)
- `docs/screenshots/guestbook-sent.png` — ทักทาย หลังส่งสำเร็จ
- `docs/screenshots/guestbook-rate-limited.png` — ฟอร์มตอนโดน rate limit

> แถบเครื่องมือสีเข้มกลางล่างของภาพคือ Astro dev toolbar (มีเฉพาะ `npm run dev` ไม่อยู่บน production)

### Findings (ไม่ได้แก้ `src/` ในรอบนี้)

| # | ระดับ | เรื่อง | รายละเอียด |
|---|---|---|---|
| F1 | ⚠️ ควรตรวจซ้ำ | player เพลย์ลิสต์ Apple (D12) แสดงแคบผิดปกติ | ใน `home.png` ที่ 1280px เนื้อหาใน iframe กว้างแค่ ~50px ทางซ้าย ทั้งที่กรอบ iframe เต็มการ์ด (น่าจะยังโหลดไม่เสร็จตอนถ่าย หรือ layout ของ embed ไม่รับความกว้างนี้) · ตรวจซ้ำตอน a11y / ขอให้ frontend ดู |
| F2 | ℹ️ | console warning จาก third-party | `musickit.js` (Apple) เตือนเรื่อง "robustness level" — มาจาก embed ไม่ใช่โค้ดเรา |
| F3 | ℹ️ | console error ที่ตั้งใจ | 404 ของ `/nope-e2e` (step 5) และ 429/400 ของ step 7–10 — เป็นผลของการทดสอบ ไม่ใช่ bug |
| F4 | ℹ️ | ข้อมูลทดสอบค้างใน DB | คำทัก `demo` จาก step 6 อยู่ใน `$DATA_DIR/site.sqlite` ของเครื่องนี้ · มีรายการ `1111` / `11111` อยู่ก่อนแล้ว (ไม่ได้มาจากรอบนี้) · ลบได้ตาม `docs/GUESTBOOK.md` |

## a11y Debate

> 2026-09-25 · Input: ผล E2E ด้านบน + หน้า Contact (`/contact` → 301 → `/guestbook` ตาม D2/D3 · ฟอร์มที่ผู้ชมใช้จริงคือฟอร์มทักทาย) · ตรวจจากโค้ด `src/layouts/BaseLayout.astro` · `src/pages/guestbook.astro` · `src/styles/tokens.css` · contrast คำนวณตามสูตร WCAG 2.x

### Advocate

**สิ่งที่ดีอยู่แล้ว**
- ข้อความทุกสีผ่าน AA บนพื้นขาว: text 15.23:1 · muted `#6B5B85` 6.07:1 · danger `#DC2626` 4.83:1 · success `#15803D` 5.02:1 (แก้แล้วตาม D8) · ปุ่มขาวบน primary 10.39:1
- ฟอร์ม: `<label for>` ครบทั้งสองช่อง · hint ผูกด้วย `aria-describedby` · ผลส่งใช้ `role="status"` · ปุ่มสูง 44px · `lang="th"` · `aria-current="page"` บนเมนู
- Heading order: ทุกหน้ามี h1 เดียว · `/about` และ `/guestbook` เป็น h1 → h2 ไม่กระโดดชั้น
- iframe เพลงมี `title` · ข้อความผู้ชมแสดงด้วย `textContent` (e2e ยืนยัน)

**ปัญหา (เรียงตามผลกระทบ)**
1. **Focus ring มองแทบไม่เห็น — 1.81:1** · `--ci-ring` = `rgba(139,92,246,0.45)` ผสมบนขาวได้ `#CBB6FB` ต่ำกว่า 3:1 ที่ WCAG 1.4.11 กำหนดให้ตัวบอก focus · และ `outline: none` ทำให้ ring นี้เป็นสิ่งเดียวที่บอกตำแหน่ง focus → คนใช้คีย์บอร์ดหลงในฟอร์ม (2.4.7)
2. **ตัวนับ `0/280` พูดทุกครั้งที่กดแป้น** · `#gb-count` มี `aria-live="polite"` → screen reader ประกาศ "1/280 · 2/280 …" แทรกทุกตัวอักษรที่พิมพ์ · ทั้งที่ผูกอยู่ใน `aria-describedby` ของ textarea แล้ว (อ่านให้ตอน focus)
3. **ขอบช่องกรอกจางเกิน — 1.54:1** · `input, textarea` ใช้ `--ci-border` `#D5CDE0` · WCAG 1.4.11 ต้อง ≥ 3:1 เพื่อให้เห็นว่าตรงไหนคือช่องกรอก (คนสายตาเลือนรางมองไม่เห็นกรอบบนพื้นการ์ดขาว)
4. **Error ฝั่ง client ไม่ผูกกับช่อง** · validate ไม่ผ่านแล้วขึ้นข้อความใน `role="status"` แต่ไม่ตั้ง `aria-invalid` และไม่ย้าย focus ไปช่องที่ผิด → คนใช้ screen reader ได้ยินข้อความแต่ไม่รู้ว่าต้องแก้ช่องไหน (3.3.1)
5. **ทั้งรายการคำทักเป็น `aria-live`** · `<ul id="gb-entries" aria-live="polite">` → โหลดหน้า/ส่งสำเร็จแล้ว render ใหม่ทั้งก้อน = อ่านทุกคำทักยาวเหยียด · ซ้ำกับ `role="status"` ที่บอก "ได้รับแล้ว" อยู่แล้ว
6. ลิงก์ "ฟังต่อบน Apple Music ↗" เปิดแท็บใหม่ (`target="_blank"`) แต่บอกด้วยลูกศรอย่างเดียว · screen reader ไม่รู้ว่าจะเปิดแท็บใหม่
7. ไม่มี skip link (มีเมนูแค่ 3 ลิงก์ ผลกระทบต่ำ) · หัวการ์ดเพลง "เพลงฮิตไทยวันนี้" เป็น `<p>` ไม่ใช่ heading → หน้าแรกมีแค่ h1 นำทางด้วย heading ไม่ได้
8. ลิงก์ไม่มีขีดเส้นใต้ (แยกด้วยสี primary vs text เท่านั้น) — ตอนนี้ลิงก์ทุกจุดเป็นลิงก์เดี่ยว/ตัวหนา ไม่ได้อยู่กลางประโยค จึงยังไม่ผิด 1.4.1 แต่ต้องระวังถ้าเพิ่มลิงก์ในเนื้อหา

### Pragmatist

- **เกณฑ์แบ่ง:** fix ก่อน ship = กระทบการใช้ฟอร์มทักทาย (จุดมีส่วนร่วมเดียวของเว็บ · D2) ด้วยคีย์บอร์ด/screen reader **และ** แก้ได้ไม่กี่บรรทัดโดยไม่เปลี่ยนหน้าตาเว็บเกินธีม D8 · ที่เหลือหลัง ship
- ข้อ 1–3 เป็น token/attribute บรรทัดเดียว เสี่ยงต่ำ ทดสอบด้วย e2e ที่มีอยู่ได้ → **ก่อน ship**
- ข้อ 4–5 ต้องแก้ script ฟอร์ม ~10 บรรทัด + เพิ่มเคส e2e · ทำได้ในรอบเดียวกันถ้าเวลาเหลือ ไม่งั้นต้นสัปดาห์แรกหลัง ship — ผู้ใช้ยังส่งคำทักสำเร็จได้ (status บอกผลอยู่)
- ข้อ 6–8 ผลกระทบต่ำ · ข้อ 8 ยังไม่ผิดตอนนี้ → จดไว้เป็นกติกา ไม่ต้องแก้
- F1 (player กว้างผิดปกติที่ 1280px) ไม่ใช่ a11y โดยตรง แต่ถ้า player ใช้ไม่ได้จริงคือฟีเจอร์พัง → ตรวจซ้ำบน build (ไม่ใช่ dev) ก่อนตัดสิน · ตอนทำ D12 วัดได้กว้าง 670px ปกติ
- ไม่ขอ audit เต็ม (axe/Lighthouse) ก่อน ship — ใช้ axe ใน Playwright เป็นงานหลัง ship

## a11y Action items (prioritized P0/P1/P2)

| # | P | งาน | ไฟล์ · owner | เวลา | ตรวจยังไง |
|---|---|---|---|---|---|
| A1 | **P0** | Focus ring ทึบ ≥ 3:1: `--ci-ring` → `0 0 0 3px var(--ci-accent)` (4.23:1) | `src/styles/tokens.css` · Claude | 5 นาที | Tab ผ่านเมนู/ช่อง/ปุ่ม เห็นกรอบชัด · e2e เดิมผ่าน |
| A2 | **P0** | เอา `aria-live` ออกจาก `#gb-count` (คงอยู่ใน `aria-describedby` → อ่านตอน focus) | `src/pages/guestbook.astro` · Claude | 2 นาที | NVDA/Narrator พิมพ์แล้วไม่ประกาศตัวเลขทุกแป้น |
| A3 | **P1** | ขอบ `input, textarea` ≥ 3:1: ใช้ `#857799` (4.12:1) เป็น token ใหม่ `--ci-border-strong` | `tokens.css` + `BaseLayout.astro` · Claude | 10 นาที | วัด contrast · ภาพ 360px ยังเข้าธีม D8 |
| A4 | **P1** | Error client: ตั้ง `aria-invalid="true"` + focus ช่องแรกที่ผิด · ล้างเมื่อพิมพ์ใหม่ | `guestbook.astro` script · Claude | 15 นาที | เพิ่มเคส e2e: ส่งว่าง → focus อยู่ที่ชื่อเล่น + `aria-invalid` |
| A5 | **P1** | ย้าย `aria-live` ออกจาก `#gb-entries` (ให้ `role="status"` บอกผลอย่างเดียว) | `guestbook.astro` · Claude | 2 นาที | โหลดหน้าแล้ว screen reader ไม่อ่านทั้งรายการ |
| A6 | P2 | ลิงก์เปิดแท็บใหม่: เพิ่มข้อความซ่อน "(เปิดแท็บใหม่)" หรือ `aria-label` | `index.astro` · Claude | 5 นาที | อ่านลิงก์แล้วได้ยินว่าเปิดแท็บใหม่ |
| A7 | P2 | หัวการ์ดเพลงเป็น `<h2>` (หน้าตาเดิม) · skip link "ข้ามไปเนื้อหา" | `index.astro` · `BaseLayout.astro` · Claude | 10 นาที | รายการ heading ของหน้าแรกมี h1 → h2 |
| A8 | P2 | ตรวจ F1 ซ้ำบน `npm start` ที่ 1280px · เพิ่ม axe (`@axe-core/playwright`) ใน e2e | `playwright/` · Claude (Lab 06) | 30 นาที | axe 0 violation ระดับ serious |

**รวม P0+P1 = 5 ข้อ (A1–A5) · ประมาณ 34 นาที · ทั้งหมดเป็นไฟล์ UI (ownership Claude) ไม่แตะ API**

### Diff ที่เสนอ (ยังไม่แก้ไฟล์ — รอยืนยัน)

A1 — บรรทัดเดียว แก้ทุกจุดที่ใช้ `--ci-ring` พร้อมกัน:

```diff
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -59 +59 @@
-  --ci-ring: 0 0 0 3px rgba(139, 92, 246, 0.45);
+  --ci-ring: 0 0 0 3px var(--ci-accent);   /* solid #8B5CF6 = 4.23:1 on white (WCAG 1.4.11 ≥ 3:1) */
```
