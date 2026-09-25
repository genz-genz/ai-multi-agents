import { test, expect } from '@playwright/test';

// Guestbook contract end to end (D4 / D9). Run against a server with a fresh
// DATA_DIR and TRUST_PROXY=1 (as in production behind Coolify): the in-memory
// rate limit (1 post/min/IP) makes these cases order-dependent, so they run
// serially in one worker.
test.describe.configure({ mode: 'serial' });

const stamp = Date.now().toString(36);
const OK_MESSAGE = `สวัสดีจากเดโม่ ${stamp}`;
const XSS_MESSAGE = `<img src=x onerror="window.__xss=1"> ${stamp}`;

test('posting the form shows success and the new entry', async ({ page }) => {
  await page.goto('/guestbook');
  await page.getByLabel('ชื่อเล่น').fill('เดโม่');
  await page.getByLabel('ข้อความ').fill(OK_MESSAGE);
  await page.getByRole('button', { name: 'ส่งคำทัก' }).click();

  await expect(page.getByRole('status')).toContainText('ได้รับแล้ว');
  await expect(page.locator('#gb-entries')).toContainText(OK_MESSAGE);
});

test('posting again within a minute shows the rate-limit message', async ({ page }) => {
  await page.goto('/guestbook');
  await page.getByLabel('ชื่อเล่น').fill('เดโม่');
  await page.getByLabel('ข้อความ').fill(`อีกข้อความ ${stamp}`);
  await page.getByRole('button', { name: 'ส่งคำทัก' }).click();

  await expect(page.getByRole('status')).toContainText('ทักถี่ไปนิด');
  await expect(page.locator('#gb-entries')).not.toContainText(`อีกข้อความ ${stamp}`);
});

test('validation runs before the rate limit', async ({ request }) => {
  // Still inside the rate window from the first case: a link must be reported
  // as INVALID_LINK, not RATE_LIMITED (clear error first — D9).
  const res = await request.post('/api/guestbook', { data: { name: 'เดโม่', message: 'ไปที่ www.example.com' } });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({ error: 'INVALID_LINK' });
});

test('visitor HTML is shown as text, never executed', async ({ page, request }) => {
  // Seed as a different visitor: with TRUST_PROXY=1 the last X-Forwarded-For
  // entry is the client address (L12), so a fresh one gets its own rate window.
  const seeded = await request.post('/api/guestbook', {
    headers: { 'x-forwarded-for': `10.9.${Math.floor(Math.random() * 250)}.1` },
    data: { name: '<b>แขก</b>', message: XSS_MESSAGE },
  });
  test.skip(seeded.status() === 429, 'server not started with TRUST_PROXY=1 — cannot seed as a second visitor');
  expect(seeded.status()).toBe(201);

  await page.goto('/guestbook');
  const entries = page.locator('#gb-entries');
  await expect(entries).toContainText(XSS_MESSAGE);
  await expect(entries.locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as { __xss?: number }).__xss)).toBeUndefined();
});
