import type { APIRoute } from 'astro';
import {
  ApiError,
  insertGuestbook,
  listGuestbook,
  parseGuestbookInput,
  type GuestbookEntry,
} from '../../lib/db';

export const prerender = false;

/**
 * GET  /api/guestbook → 200 { entries } (newest first)
 * POST /api/guestbook { name, message } → 201 entry
 * Errors (D9 — closed set, no stack/SQL/internal message):
 *   400 INVALID_INPUT · 400 INVALID_LINK · 403 READONLY · 429 RATE_LIMITED · 500 SERVER_ERROR
 */

const CODE_STATUS: Record<string, number> = {
  INVALID_INPUT: 400,
  INVALID_LINK: 400,
  READONLY: 403,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
};

function errorResponse(code: string): Response {
  const status = CODE_STATUS[code] ?? 500;
  const safe = CODE_STATUS[code] !== undefined ? code : 'SERVER_ERROR';
  return new Response(JSON.stringify({ error: safe }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// D4: rate limit 1 message/minute/IP — in process memory ONLY (few minutes TTL),
// never written to DB or logs. Single container assumption (handoff §Assumptions).
const RATE_WINDOW_MS = 60_000;
const RATE_TTL_MS = 5 * 60_000;
const lastPostAt = new Map<string, number>();

function sweepExpired(now: number): void {
  for (const [ip, ts] of lastPostAt) {
    if (now - ts > RATE_TTL_MS) lastPostAt.delete(ip);
  }
}

function clientIp(request: Request, clientAddress: string | undefined): string {
  // Trust X-Forwarded-For only when explicitly behind a proxy (TRUST_PROXY=1,
  // set in Coolify env at deploy — never baked into the image). Take the LAST
  // entry: the one our proxy appended; earlier entries are client-controlled
  // and spoofable (L12). Without the env, the socket address is the truth.
  if (process.env.TRUST_PROXY === '1') {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      const parts = forwarded.split(',');
      const last = parts[parts.length - 1].trim();
      if (last) return last;
    }
  }
  return clientAddress ?? 'unknown';
}

export const GET: APIRoute = async () => {
  try {
    const entries = listGuestbook();
    return new Response(JSON.stringify({ entries }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('guestbook GET failed', err); // server-side only — never echoed to the client
    return errorResponse('SERVER_ERROR');
  }
};

// L12: reject oversized bodies before parsing (D9 closed set → INVALID_INPUT).
const MAX_BODY_BYTES = 10 * 1024;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // D5: instant kill-switch for new submissions (reads env per request)
  if (process.env.GUESTBOOK_READONLY === '1') return errorResponse('READONLY');

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) return errorResponse('INVALID_INPUT');

  let body: unknown;
  try {
    // Read as text so the cap also holds for chunked requests that carry no
    // content-length; TextEncoder gives exact UTF-8 bytes.
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      return errorResponse('INVALID_INPUT');
    }
    body = JSON.parse(text);
  } catch {
    return errorResponse('INVALID_INPUT');
  }
  if (body === null || typeof body !== 'object') return errorResponse('INVALID_INPUT');

  try {
    // Validate first (D9: precise error beats 429) — rejected posts never burn the rate slot
    const input = parseGuestbookInput(body as { name?: unknown; message?: unknown });

    const now = Date.now();
    const ip = clientIp(request, clientAddress);
    sweepExpired(now);
    const last = lastPostAt.get(ip);
    if (last !== undefined && now - last < RATE_WINDOW_MS) return errorResponse('RATE_LIMITED');

    const row: GuestbookEntry = insertGuestbook(input);
    lastPostAt.set(ip, now); // count successful posts only
    return new Response(JSON.stringify(row), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof ApiError) return errorResponse(err.code);
    console.error('guestbook POST failed', err);
    return errorResponse('SERVER_ERROR');
  }
};
