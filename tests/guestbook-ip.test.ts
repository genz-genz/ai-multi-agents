import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * L12 regression: rate limit must not be bypassable via spoofed
 * X-Forwarded-For, and POST /api/guestbook caps the body at ~10KB.
 * Route is imported dynamically AFTER DATA_DIR is set (db.ts caches the path).
 * Each case uses its own clientAddress/IP so the in-memory rate map never
 * clashes between tests.
 */

type PostRoute = typeof import('../src/pages/api/guestbook').POST;
let POST: PostRoute;

const dataDir = mkdtempSync(join(tmpdir(), 'guestbook-ip-'));

function req(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/guestbook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const post = (request: Request, clientAddress: string): Promise<Response> =>
  POST({ request, clientAddress } as never);

beforeAll(async () => {
  process.env.DATA_DIR = dataDir;
  delete process.env.TRUST_PROXY;
  ({ POST } = await import('../src/pages/api/guestbook'));
});

afterAll(() => {
  delete process.env.TRUST_PROXY;
  delete process.env.DATA_DIR;
  // Windows: better-sqlite3 holds the file handle until process exit — best effort.
  try {
    rmSync(dataDir, { recursive: true, force: true });
  } catch {
    /* leave temp dir for the OS to clean */
  }
});

describe('L12 guestbook IP trust + body cap', () => {
  it('ignores spoofed XFF when TRUST_PROXY is unset → second post is 429', async () => {
    delete process.env.TRUST_PROXY;
    const first = await post(
      req({ name: 'Ada', message: 'hi' }, { 'x-forwarded-for': '1.1.1.1' }),
      '203.0.113.10',
    );
    expect(first.status).toBe(201);
    const second = await post(
      req({ name: 'Ada', message: 'hi again' }, { 'x-forwarded-for': '2.2.2.2' }),
      '203.0.113.10',
    );
    expect(second.status).toBe(429);
    expect(await second.json()).toEqual({ error: 'RATE_LIMITED' });
  });

  it('TRUST_PROXY=1 trusts only the LAST XFF entry → spoofed first entry still 429', async () => {
    process.env.TRUST_PROXY = '1';
    const first = await post(
      req({ name: 'Ada', message: 'hi' }, { 'x-forwarded-for': '5.5.5.5, 2.2.2.2' }),
      '203.0.113.20',
    );
    expect(first.status).toBe(201);
    const second = await post(
      req({ name: 'Ada', message: 'hi again' }, { 'x-forwarded-for': '9.9.9.9, 2.2.2.2' }),
      '203.0.113.20',
    );
    expect(second.status).toBe(429);
    expect(await second.json()).toEqual({ error: 'RATE_LIMITED' });
  });

  it('TRUST_PROXY=1 without XFF falls back to clientAddress', async () => {
    process.env.TRUST_PROXY = '1';
    const first = await post(req({ name: 'Ada', message: 'hi' }), '203.0.113.30');
    expect(first.status).toBe(201);
    const second = await post(req({ name: 'Ada', message: 'hi again' }), '203.0.113.30');
    expect(second.status).toBe(429);
    expect(await second.json()).toEqual({ error: 'RATE_LIMITED' });
  });

  it('rejects bodies over ~10KB with 400 INVALID_INPUT before parsing', async () => {
    delete process.env.TRUST_PROXY;
    // Valid name/message + inert padding: passes validation, so only the
    // body-size cap can reject it (pad field is ignored by parseGuestbookInput).
    const padded = JSON.stringify({ name: 'Ada', message: 'ok', pad: 'x'.repeat(20 * 1024) });
    const res = await post(req(padded), '203.0.113.40');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'INVALID_INPUT' });
  });
});
