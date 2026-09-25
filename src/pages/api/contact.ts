import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * POST /api/contact — permanently closed (DECISIONS D3 · human chose 410 on 2026-09-25).
 *
 * This route MUST NOT process request bodies: no JSON parse, no validation,
 * no insertContact call. `insertContact` in src/lib/db.ts stays for the
 * tests/labs contract only — it is not reachable from the web.
 *
 * 410 (not 404) says this endpoint existed and was removed on purpose.
 */
export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ error: 'GONE' }), {
    status: 410,
    headers: { 'content-type': 'application/json' },
  });
};
