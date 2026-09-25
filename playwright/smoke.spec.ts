import { test, expect } from '@playwright/test';

test('home renders nav and heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

// D3/D13: the contact form was removed — the page redirects and the API is gone
test('contact redirects to guestbook and its API answers 410', async ({ page, request }) => {
  const res = await request.get('/contact', { maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(res.headers()['location']).toMatch(/\/guestbook$/);

  const api = await request.post('/api/contact', { data: { name: 'a', email: 'demo@example.com', message: 'hi' } });
  expect(api.status()).toBe(410);
  expect(await api.json()).toEqual({ error: 'GONE' });

  await page.goto('/contact');
  await expect(page).toHaveURL(/\/guestbook$/);
});
