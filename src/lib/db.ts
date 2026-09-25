/**
 * SQLite helpers for contact + guestbook (better-sqlite3).
 * Lab 05 (OpenCode) — implemented per DECISIONS D3/D4/D5.
 *
 * Validation lives here (server-side is the source of truth, D4).
 * Helpers throw `ApiError` with a closed-set public code (D9);
 * routes map code → HTTP status and never leak stack/SQL/message.
 */
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export type GuestbookEntry = {
  id: number;
  name: string;
  message: string;
  created_at: string;
};

/** Public error codes (closed set, D9) — safe to expose as `{ error: code }`. */
export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_LINK'
  | 'READONLY'
  | 'RATE_LIMITED'
  | 'GONE'
  | 'SERVER_ERROR';

/** Error carrying a public code only — no internal details in `message`. */
export class ApiError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
    this.name = 'ApiError';
  }
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  const dir = process.env.DATA_DIR || join(process.cwd(), 'data');
  mkdirSync(dir, { recursive: true });
  db = new Database(join(dir, 'site.sqlite'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS guestbook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

// Limits must match the UI contract (DECISIONS D4 · docs/handoffs/04-claude-to-opencode.md)
const NAME_MAX = 30;
const MESSAGE_MAX = 280;
const CONTACT_NAME_MAX = 100;
const CONTACT_EMAIL_MAX = 254;
const CONTACT_MESSAGE_MAX = 2000;

// D4: basic link rejection — scheme, `www.`, and bare domains on common TLDs.
// Deliberately narrower than "any dot" to avoid false positives on Thai prose.
const LINK_PATTERN =
  /(?:https?:\/\/|www\.|[a-z0-9][a-z0-9-]*\.(?:com|net|org|io|co|th|me|dev|app|xyz|info|shop|site|online|co\.th|or\.th|ac\.th|in\.th)\b)/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireText(value: unknown): string {
  if (typeof value !== 'string') throw new ApiError('INVALID_INPUT');
  const trimmed = value.trim();
  if (!trimmed) throw new ApiError('INVALID_INPUT');
  return trimmed;
}

function requireMax(value: string, max: number): string {
  if (value.length > max) throw new ApiError('INVALID_INPUT');
  return value;
}

function rejectLinks(...values: string[]): void {
  if (values.some((v) => LINK_PATTERN.test(v))) throw new ApiError('INVALID_LINK');
}

/** Insert one guestbook greeting. Validates per D4 (trim · length · no links · no email). */
export function insertGuestbook(input: {
  name?: unknown;
  message?: unknown;
}): GuestbookEntry {
  const { name, message } = parseGuestbookInput(input);

  const created_at = new Date().toISOString(); // ISO 8601 UTC — agreed contract with UI
  const info = getDb()
    .prepare('INSERT INTO guestbook (name, message, created_at) VALUES (?, ?, ?)')
    .run(name, message, created_at);
  const id = Number(info.lastInsertRowid);
  return { id, name, message, created_at };
}

/** Validate + normalize guestbook input (D4) — exported so routes can validate
 *  BEFORE the rate-limit gate (visitor sees the precise error, not 429). */
export function parseGuestbookInput(input: {
  name?: unknown;
  message?: unknown;
}): { name: string; message: string } {
  const name = requireMax(requireText(input.name), NAME_MAX);
  const message = requireMax(requireText(input.message), MESSAGE_MAX);
  rejectLinks(name, message);
  return { name, message };
}

/** Newest first — ORDER BY id DESC (created_at is not unique within a second). */
export function listGuestbook(): GuestbookEntry[] {
  const rows = getDb()
    .prepare('SELECT id, name, message, created_at FROM guestbook ORDER BY id DESC')
    .all() as GuestbookEntry[];
  return rows;
}

/**
 * Insert a contact message. Public POST /api/contact is closed (D3 → 410 GONE);
 * this helper exists for the tests/labs contract and is not reachable from the web.
 */
export function insertContact(input: {
  name?: unknown;
  email?: unknown;
  message?: unknown;
}): ContactMessage {
  const name = requireMax(requireText(input.name), CONTACT_NAME_MAX);
  const email = requireMax(requireText(input.email), CONTACT_EMAIL_MAX);
  if (!EMAIL_PATTERN.test(email)) throw new ApiError('INVALID_INPUT');
  const message = requireMax(requireText(input.message), CONTACT_MESSAGE_MAX);

  const created_at = new Date().toISOString();
  const info = getDb()
    .prepare('INSERT INTO contact_messages (name, email, message, created_at) VALUES (?, ?, ?, ?)')
    .run(name, email, message, created_at);
  const id = Number(info.lastInsertRowid);
  return { id, name, email, message, created_at };
}
