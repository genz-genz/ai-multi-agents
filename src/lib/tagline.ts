/**
 * Random home-page tagline, assembled from Thai sentence templates plus the
 * owner's Interests (docs/PROFILE.md). No network, no key — the owner and
 * visitors never need to touch it (L4 · PROFILE.md ## Brainstorm).
 */

/** `{a}` / `{b}` are replaced with two different interests. */
export const TEMPLATES: readonly string[] = [
  'วันนี้ขอ{a}ไปก่อน',
  'สถานะตอนนี้: กำลัง{a}',
  'แผนชีวิตวันนี้: {a} แล้วค่อยว่ากัน',
  'ถ้าหาไม่เจอ แปลว่ากำลัง{a}',
  '{a}ก่อน ที่เหลือไว้พรุ่งนี้',
  'ครึ่งวันแรก{a} ครึ่งวันหลัง{b}',
  'ตั้งใจจะ{a} สุดท้ายก็{b}',
];

const FALLBACK = 'Hello world';

export function pickTagline(interests: string[], rand: () => number = Math.random): string {
  const n = interests.length;
  if (n === 0) return FALLBACK;
  const pool = n >= 2 ? TEMPLATES : TEMPLATES.filter((t) => !t.includes('{b}'));
  const template = pool[Math.floor(rand() * pool.length)];
  const a = Math.floor(rand() * n);
  // Offset by 1..n-1 so {b} is always a different interest from {a}.
  const b = n >= 2 ? (a + 1 + Math.floor(rand() * (n - 1))) % n : a;
  return template
    .replace('{a}', interests[a])
    .replace('{b}', interests[b])
    // Thai style: ไม้ยมก (ๆ) is followed by a space before more text.
    .replace(/ๆ(?=[^\s])/g, 'ๆ ');
}
