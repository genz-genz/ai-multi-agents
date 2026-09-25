# Agents — Build AI Multi-Agent Lab (V4) · seed

กติการ่วมสำหรับ **Claude Code** และ **OpenCode**  
สินค้า = เว็บ personal branding (Astro) ใน root นี้

หลัง Lab 00: `/init` แล้ว **merge** — อย่าลบ Ownership / สี่เสา / Native harness

ใช้ skill **`public-site-safe`** ทุกงาน implement / swarm / ship

## สี่เสาหลัก

1. **Multi-Agent** — หน้าที่และความจำแยก (ไฟล์ใน `.claude/agents/`, `.opencode/agents/` + คนละ CLI)
2. **Sub-Agent** — spawn ใช้แล้วทิ้ง; สิ่งที่ต้องจำต่อ = เขียนลง `docs/` เท่านั้น
3. **การประสานงาน** — handoff ผ่าน docs / issues / PR / review สำคัญกว่าแชทเดียว
4. **Swarm** — หลายตัวได้; **เพดาน 20 turns** แล้วหยุดสรุปช่องว่าง (Lab 05b)

## สี่ชั้นความรู้ (อ่านก่อนลงมือ)

| ชั้น | ไฟล์หลัก |
|---|---|
| Rules | ไฟล์นี้ · `CLAUDE.md` · skill `public-site-safe` |
| Context | `COURSE.md` · `docs/PROFILE.md` · `docs/DECISIONS.md` |
| State (Hot) | `docs/STATUS.md` · `docs/OPEN_LOOPS.md` |
| Artifacts | `src/` · tests · `docs/QA.md` · PR |

**Hot / Warm / Cold:** Hot = STATUS + OPEN_LOOPS + handoff ล่าสุด · Warm = PROFILE/DECISIONS/Ownership · Cold = `_cli-*` / logs เก่า  
**Proposed vs Approved:** `DEBATE.md` = ยังไม่ปิด · `DECISIONS.md` = อนุมัติแล้วเท่านั้น

### Start-of-session (≤ 8 บรรทัด)

ก่อนเริ่มงานทุกครั้ง:

1. อ่าน `docs/STATUS.md` และ `docs/OPEN_LOOPS.md`
2. ถ้ามี handoff ล่าสุดใน `docs/handoffs/` ที่ส่งถึงคุณ — อ่านด้วย
3. สรุปให้คนดู: Current goal · Latest D-id (ถ้ามี) · Open loops · Blockers — **ไม่เกิน 8 บรรทัด**
4. ถ้าข้อมูลขัดแย้งระหว่างไฟล์ — หยุดวิเคราะห์ก่อนแก้โค้ด
5. **ห้าม**สมมุติว่าคุณรู้สิ่งที่เกิดในแชทของ CLI อีกฝั่ง ถ้าไม่มีเขียนใน `docs/`

จบงานที่เปลี่ยนสถานะ: อัปเดต `STATUS.md` / `OPEN_LOOPS.md` (และ handoff ถ้าสลับ harness)

## Single-writer (ไฟล์ร่วมมีคนเขียนคนเดียวต่อรอบ)

- `docs/STATUS.md` และ `docs/OPEN_LOOPS.md` มี **writer คนเดียวต่อรอบ** — สลับ Claude ↔ OpenCode หลัง commit หรือหลังเขียน handoff
- Ownership โค้ดตามตารางด้านล่าง — reviewer อ่านอย่างเดียวจนกว่าจะโอนงานชัดใน handoff
- อย่าให้สอง agent แก้ไฟล์เดียวกันพร้อมกันโดยไม่แยก branch

## Ownership

| Artifact | Owner |
|---|---|
| UI (`src/pages/*.astro`, `src/layouts/`, styles) | Claude · agent `frontend` |
| API + SQLite (`src/lib/db.ts`, `src/pages/api/*`) | OpenCode · agent `backend` |
| E2E / a11y (`docs/QA.md`) | Playwright MCP + either CLI |
| Profile / debate docs | Claude (Lab 01–02 · subagents) |
| Hot state (`STATUS.md` · `OPEN_LOOPS.md`) | ผู้ถืองานรอบนั้น (single-writer) |
| Handoffs (`docs/handoffs/`) | ผู้ส่งงานก่อนสลับ harness |
| Review artifacts | Lab 07 · agent `reviewer` (Claude) / OpenCode review |
| Ship (`docs/SHIP.md`) | Lab 08 |

## Commands

```powershell
npm run dev          # Astro dev server → http://localhost:4321
npm test             # Vitest: tests/**/*.test.ts (ยกเว้น tests/labs) — CI รันอันนี้ + build
npm run test:labs    # Vitest: tests/labs/** — RED โดยตั้งใจจนกว่า Lab 05 implement
npm run test:e2e     # Playwright (playwright/) — ต้องมี server รันอยู่ก่อน · PLAYWRIGHT_BASE_URL
npm run build        # astro build → dist/
npm start            # node ./dist/server/entry.mjs (standalone)
npx vitest run tests/smoke.test.ts           # รันไฟล์เดียว
npx vitest run -t "insertContact persists"   # รันตามชื่อ test
node scripts/create-course-issues.mjs        # สร้าง Issues ของ Labs ลง GitHub
```

- Node **≥ 22.12** · Windows/PowerShell เป็นหลัก
- CI (`.github/workflows/ci.yml`) = `npm ci && npm test && npm run build` — **ไม่**รัน test:labs / e2e

## Architecture (big picture)

- **Astro SSR** (`output: 'server'`, `@astrojs/node` standalone, port 4321) — ทุกหน้า/API render ตอน request ไม่มี static output
- **Content มาจาก docs:** `src/lib/profile.ts` อ่าน `docs/PROFILE.md` ตอน runtime ตามหัวข้อ `## Name / Headline / Bio / Audience / Interests` (Interests = bullet list) → หัวข้อหาย/ไฟล์ไม่มี = ใช้ `FALLBACK` → **แก้ PROFILE.md = แก้เว็บ ห้ามเปลี่ยนชื่อหัวข้อ** · `Dockerfile` copy `docs/` เข้า image ด้วย
- **API** `src/pages/api/*.ts` (`prerender = false`) เรียก helper ใน `src/lib/db.ts` — stub โยน `NOT_IMPLEMENTED…` → route แปลงเป็น 501 · error อื่น → 400 (POST) / 500 (GET)
- **SQLite** (`better-sqlite3`) ไฟล์ `$DATA_DIR/site.sqlite` (default `./data`) · schema สร้างใน `getDb()` · connection cache ระดับ module
- **Test guard `tests/public-site.test.ts`:** ข้อความที่ render ใน `.astro`/`.html` ห้ามอ้างถึงคอร์ส (เช่น "Lab 04", "แล็บ") — ใส่ได้เฉพาะ frontmatter / HTML comment / `.ts` comment
- Agent files: `.claude/agents/` (frontend, reviewer) · `.opencode/agents/` (backend) · skills `public-site-safe` + คู่ cross-CLI (`claude-code` ฝั่ง OpenCode, `opencode` ฝั่ง Claude)

## Setup / env

- ยังไม่มี `.env` / `opencode.json` / `.claude/settings.json` ให้ copy จาก `.example` ของไฟล์นั้น (`SETUP.md` หรือ Lab 00)
- `.env` เก็บ `STUDENT_SLUG`, `SITE_URL`, `DATA_DIR`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `COOLIFY_DEPLOY_WEBHOOK` — **ห้าม commit**
- ตั้งค่า MCP (github + playwright) ผ่าน `opencode.json` / `.mcp.json` จากไฟล์ `.example`

## ความจำ

| ชนิด | อยู่ที่ | ตัวอย่าง |
|---|---|---|
| ร่วม (shared) | `docs/`, git, PR | STATUS, OPEN_LOOPS, PROFILE, DECISIONS, QA, handoffs |
| แยก (agent-local) | เซสชัน + ไฟล์ agent | frontend ไม่ถือ context backend |
| **Harness persistent** | Claude / OpenCode native | ดูตารางด้านล่าง — **ห้ามสร้าง memory bus เอง — ใช้ของที่ harness มีให้** |
| ทิ้งได้ | Sub-Agent รอบเดียว | Brand/UX/Devil หลังจบ Lab 02 |

### Harness persistent memory (ตรวจใน Lab 00)

| เครื่องมือ | ใช้ของอะไร | ตรวจยังไง |
|---|---|---|
| Claude Code | `memory: project` บน agent → `.claude/agent-memory/<name>/` · auto memory ผ่าน `/memory` | จำข้ามเซสชัน + มีไฟล์ MEMORY |
| OpenCode | `AGENTS.md` + agent file + **resume session** | resume เห็นบริบท · เซสชันใหม่ไม่บังคับ recall ปากเปล่า |

ความจำร่วมของคอร์ส (`docs/`) คนละชั้นกับ harness memory — สิ่งที่ต้องโชว์ข้ามคน/CLI ให้เขียนลง `docs/`  
Adapter (ไฟล์กติกาที่แต่ละ CLI อ่าน — `AGENTS.md` / `CLAUDE.md`) ต้อง**ชี้ไป**ไฟล์กลาง — อย่าคัดลอกเนื้อหา STATUS/DECISIONS ซ้ำใน adapter

## Workflow

```text
00 Init → 01 Interview → 02 Debate → 03 Issues → 04 FE → 05 BE → 05b Swarm(≤20) → 06 QA → 07 Review → 08 Ship
```

## Native harness only

harness = ความสามารถถาวรที่ Claude Code / OpenCode มีให้ในตัว (memory, plugin, session) — ใช้ของเดิม ไม่สร้างชั้นเอง

- Plugins project scope: superpowers (oh-my-openagent ยังไม่รองรับ OpenCode v2 — ใช้ native agents)
- **Call ข้าม harness ทำได้** — แต่ละตัวยังรันบน harness ตนเอง: ฝั่ง OpenCode เรียก `claude -p` · ฝั่ง Claude เรียก `opencode run` (headless one-shot · ท่อ = ไฟล์ใน `docs/`)
- **กติกา call:** ฝั่งที่ถูกเรียกเขียนได้**เฉพาะไฟล์รายงาน**ที่ prompt ระบุ (เช่น `docs/review-*.md`) — ห้ามแตะไฟล์ ownership ของผู้เรียก · อย่าให้สอง harness เขียน working tree พร้อมกัน (commit ก่อน)
- ห้ามสร้างระบบส่งข้อความ/สถานะระหว่าง CLI เอง (เช่น ใช้ไฟล์ JSON เป็นท่อส่งงาน) · ห้าม daemon/loop ถาวร
- MCP = งานผลิต — **ไม่ใช่**ท่อระหว่างสอง CLI
- Swarm หยุดเมื่อ done **หรือ** ครบ **20 turns**

## ห้าม

- Commit `.env`, PAT, Coolify webhook, `node_modules`
- เคลม deploy สำเร็จโดยไม่มี URL 200 จริง
- บังคับ tmux บน Windows
- PR เข้า `Onto-IQ/*` — เข้า learner repo เท่านั้น
- ปล่อย swarm เกิน 20 turns โดยไม่สรุปหยุด

## Labs

[`SETUP.md`](./SETUP.md) → [`labs/lab-00-project-init`](./labs/lab-00-project-init/README.md) → [`labs/README.md`](./labs/README.md)
