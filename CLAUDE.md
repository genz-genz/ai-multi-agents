# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# Claude Code — seed คอร์ส (อย่าลบตอน /init)

หลัง Lab 00 ให้ `/init` **merge** — เก็บกฎด้านล่างไว้เสมอ

## สี่เสา (ย่อ)

1. Multi-Agent แยกหน้าที่/ความจำ · 2. Sub-Agent ใช้แล้วทิ้ง · 3. ประสานผ่าน docs/PR · 4. Swarm เพดาน **20 turns**

## Ownership (บังคับ)

| Artifact | Owner |
|---|---|
| UI | Claude · `.claude/agents/frontend.md` |
| API + SQLite | OpenCode · `.opencode/agents/backend.md` |
| docs PROFILE / DEBATE / DECISIONS | Claude (Lab 01–02) |
| Hot state STATUS / OPEN_LOOPS | ผู้ถืองานรอบนั้น (single-writer) |

สรุป: **Frontend = Claude · Backend = OpenCode** — Claude ห้าม implement `src/lib/db.ts` / `src/pages/api/**` เอง ให้ส่งงานผ่าน handoff ไป agent `backend`

## Canonical context (อ่านก่อน · อย่าคัดลอกซ้ำในไฟล์นี้)

ก่อนลงมือ:

1. `docs/STATUS.md`
2. `docs/OPEN_LOOPS.md`
3. handoff ล่าสุดใน `docs/handoffs/` (ถ้ามี)
4. ตามงาน: `docs/PROFILE.md` · `docs/DECISIONS.md`

สรุป Goal / Latest D-id / Open loops / Blockers **ไม่เกิน 8 บรรทัด**  
ห้ามสมมุติจากแชท OpenCode ถ้าไม่มีใน `docs/`  
จบงานที่เปลี่ยนสถานะ → อัปเดต STATUS / OPEN_LOOPS · สลับ harness → เขียน handoff จาก [`docs/handoffs/TEMPLATE.md`](docs/handoffs/TEMPLATE.md)

## กฎสั้น

- Root เท่านั้น · plugin **project scope**
- Skill **`public-site-safe`**
- Agent ถาวรใช้ `memory: project` (harness) — ตรวจใน Lab 00 · ห้ามสร้าง memory bus เอง
- **ห้ามใช้ MCP เป็นท่อส่งงาน** Claude ↔ OpenCode (MCP = งานผลิต: github/playwright) · ท่อ = ไฟล์ใน `docs/` · Cross-CLI เฉพาะ Lab 07
- **ห้าม commit `.env`** (รวม PAT / Coolify webhook) · PR เข้า learner repo เท่านั้น
- Swarm: หยุดเมื่อ done หรือครบ 20 turns
- STATUS/OPEN_LOOPS = single-writer · commit ก่อนสลับ harness

## Commands

```powershell
npm run dev          # Astro dev server → http://localhost:4321
npm test             # Vitest: tests/**/*.test.ts (ยกเว้น tests/labs) — CI รันอันนี้ + build
npm run test:labs    # Vitest: tests/labs/** — RED โดยตั้งใจจนกว่า Lab 05 จะ implement
npm run test:e2e     # Playwright (playwright/) — ต้องมี server รันอยู่ · PLAYWRIGHT_BASE_URL
npm run build        # astro build → dist/
npm start            # node ./dist/server/entry.mjs (standalone)
npx vitest run tests/smoke.test.ts           # รันไฟล์เดียว
npx vitest run -t "insertContact persists"   # รันตามชื่อ test
```

Node ≥ 22.12 · Windows/PowerShell เป็นหลัก · CI (`.github/workflows/ci.yml`) = `npm ci && npm test && npm run build`

## Architecture (big picture)

- **Astro SSR** (`output: 'server'`, `@astrojs/node` standalone) — ทุกหน้า/API render ตอน request
- **Content มาจาก docs:** `src/lib/profile.ts` parse `docs/PROFILE.md` ตามหัวข้อ `## Name / Headline / Bio / Audience / Interests` (Interests = bullet list) → ถ้าหัวข้อหายใช้ `FALLBACK` · แก้ PROFILE.md = เปลี่ยนเว็บ ดังนั้นอย่าเปลี่ยนชื่อหัวข้อ · อ่านตอน runtime → `Dockerfile` copy `docs/` เข้า image ด้วย (`DATA_DIR=/data` volume)
- **API** `src/pages/api/*.ts` (`prerender = false`) เรียก helper ใน `src/lib/db.ts` · stub โยน `NOT_IMPLEMENTED…` → route แปลงเป็น 501, error อื่น → 400 (POST) / 500 (GET)
- **SQLite** (`better-sqlite3`) ไฟล์ `$DATA_DIR/site.sqlite` (default `./data`) · schema สร้างใน `getDb()` · connection cache ระดับ module
- **Test guard `tests/public-site.test.ts`:** ข้อความที่ render ใน `.astro/.html` ห้ามอ้างถึงคอร์ส (เช่น "Lab 04", "แล็บ") — ใส่ได้เฉพาะ frontmatter / HTML comment / `.ts` comment
- `.claude/agents/` (frontend, reviewer) · `.opencode/agents/` (backend) · skills `public-site-safe`, `opencode` ใน `.claude/skills/`

## Gotchas

- **`DATA_DIR` ต้องตั้งก่อนเรียก `getDb()` ครั้งแรก** — connection cache ระดับ module จึงเปลี่ยน path ภายหลังไม่มีผล (test ใน `tests/labs/` ตั้ง `data/vitest-lab` ก่อน import)
- Pattern ของ public-site guard คือ `/\blabs?\b\s*[-–—]?\s*0?\d+\b|แล็บ/i` — ครอบคลุม "lab 5", "Labs-04" ด้วย · ข้อความ UI ที่ render (รวม `<meta>` / props default ใน markup) ควรไม่พูดถึงคอร์สเลย
- Stub ใน `db.ts` เป็นสัญญากับ route: ข้อความ error ต้องขึ้นต้น `NOT_IMPLEMENTED` ถึงจะได้ 501 — อย่าเปลี่ยน prefix
- `docs/STATUS.md` / `OPEN_LOOPS.md` มี `.example` คู่กัน — แก้ไฟล์จริง ไม่ใช่ `.example`

## Labs

ดู [`labs/README.md`](labs/README.md) · เริ่ม [`lab-00-project-init`](labs/lab-00-project-init/README.md)
