# คู่มือจัดการคำทัก (Guestbook) — สำหรับเจ้าของเว็บ

> ตามการตัดสินใจ **D5**: เจ้าของลบข้อความเองด้วยคำสั่ง ภายใน 24 ชม. เมื่อเจอปัญหา
> (doxxing / คำหยาบ / spam) — **ไม่มีหน้าแอดมิน** โดยตั้งใจ
> ไฟล์นี้เป็นเอกสารภายใน ไม่ใช่หน้าเว็บ

## ฐานข้อมูลอยู่ที่ไหน

- ไฟล์ SQLite: `$DATA_DIR/site.sqlite`
  - dev (เครื่องตัวเอง): โฟลเดอร์ `./data` (ถ้าไม่ได้ตั้ง `DATA_DIR`)
  - deploy (Coolify): volume ที่ mount เป็น `DATA_DIR` (D10 — ต้องไม่หายตอน redeploy)
- ตาราง: `guestbook (id, name, message, created_at)` — **ไม่มีคอลัมน์ IP/อีเมล** (D4)

ต้องมีโปรแกรม `sqlite3` ในเครื่อง/คอนเทนเนอร์ (ถ้าในคอนเทนเนอร์ ใช้ `docker exec -it <ชื่อคอนเทนเนอร์> sqlite3 /data/site.sqlite`)

## ดูคำทักล่าสุด

```sql
SELECT id, name, message, created_at FROM guestbook ORDER BY id DESC LIMIT 20;
```

## ลบข้อความเดี่ยว

```sql
DELETE FROM guestbook WHERE id = <รหัสจากข้างบน>;
```

เช็คก่อนลบ: `SELECT * FROM guestbook WHERE id = <รหัส>;`

## ลบหลายข้อความพร้อมกัน (เช่น spam ซ้ำ ๆ)

```sql
-- ตัวอย่าง: ลบทุกข้อความจาก "ชื่อ" เดียวกัน
DELETE FROM guestbook WHERE name = '<ชื่อที่สแปม>';
```

⚠️ รัน `SELECT` ดูก่อนทุกครั้งก่อนเปลี่ยนเป็น `DELETE` — ลบแล้วกู้คืนไม่ได้

## ฉุกเฉิน: ปิดรับคำทักใหม่ทันที (D5)

ตั้ง environment variable แล้ว **restart คอนเทนเนอร์**:

```powershell
GUESTBOOK_READONLY=1
```

- ผู้ชมที่กดส่งจะเห็น "ตอนนี้ปิดรับคำทักชั่วคราว ไว้แวะมาใหม่นะ" (403 READONLY)
- การอ่านคำทักเก่ายังทำงานปกติ
- ปิดสวิตช์ = ตั้งเป็น `0` หรือลบตัวแปร แล้ว restart

## Deploy (Lab 08 ต้องตั้งใน Coolify)

ตั้ง environment variable นี้ใน **Coolify env** (ห้ามใส่ใน `Dockerfile` — คนที่รัน
คอนเทนเนอร์ตรง ๆ โดยไม่มี proxy จะไม่เปิดช่องให้ปลอม IP):

```powershell
TRUST_PROXY=1
```

- ความหมาย: เว็บอยู่หลัง proxy ของ Coolify 1 hop → rate limit เชื่อ IP จาก
  `x-forwarded-for` **ตัวท้ายสุด** (ตัวที่ proxy append เอง · ตัวก่อนหน้าผู้ส่งปลอมได้)
- **ไม่ตั้ง** (หรือค่าอื่น) = โหมดปลอดภัยสุด: ใช้ socket address ล้วน ปลอม IP ไม่ได้
  เลย แต่ถ้า deploy หลัง proxy แล้วลืมตั้ง ทุกคนจะกลายเป็น IP เดียว (ของ proxy)
  → คนโพสต์ 1 คนล็อกทั้งเว็บ 1 นาที
- รายละเอียดช่องโหว่ที่แก้: L12 · `docs/review-swarm2-backend.md` §1

## ตัวเลขที่ควรรู้ (D4)

| กติกา | ค่า |
|---|---|
| ชื่อเล่น | ≤ 30 ตัวอักษร |
| ข้อความ | ≤ 280 ตัวอักษร |
| ลิงก์ | ปฏิเสธ (`http`, `www.`, โดเมนติดตัวอักษร) |
| ความถี่ | 1 ข้อความ/นาที/IP (นับใน memory — restart แล้วรีเซ็ต) |
| ขนาด body ของ POST | ≤ 10KB (เกิน = 400 INVALID_INPUT) |
| ข้อมูลส่วนบุคคล | ไม่เก็บอีเมล · ไม่เก็บ IP ลง DB/log |
