import { describe, it, expect } from 'vitest';
import { pickTagline, TEMPLATES } from '../src/lib/tagline';

const INTERESTS = ['ฟังเพลง', 'นั่งเฉย ๆ', 'ทำตัวเหมือนยุ่ง'];

/** Deterministic rand that replays the given values, then repeats the last. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

describe('pickTagline', () => {
  it('fills every template with interests and leaves no placeholder', () => {
    for (let t = 0; t < TEMPLATES.length; t++) {
      const r = (t + 0.5) / TEMPLATES.length;
      const line = pickTagline(INTERESTS, seq(r, 0, 0.9));
      expect(line).not.toMatch(/[{}]/);
      expect(INTERESTS.some((i) => line.includes(i))).toBe(true);
    }
  });

  it('uses two different interests in a two-slot template', () => {
    const two = TEMPLATES.findIndex((t) => t.includes('{b}'));
    const line = pickTagline(INTERESTS, seq((two + 0.5) / TEMPLATES.length, 0, 0));
    const used = INTERESTS.filter((i) => line.includes(i));
    expect(used.length).toBe(2);
  });

  it('never picks a two-slot template with a single interest', () => {
    for (let k = 0; k < 50; k++) {
      const line = pickTagline(['ฟังเพลง'], seq(k / 50, 0.3, 0.7));
      expect(line).not.toMatch(/[{}]/);
      expect(line).toContain('ฟังเพลง');
    }
  });

  it('puts a space after ๆ when text follows', () => {
    // template 0 = 'วันนี้ขอ{a}ไปก่อน'
    expect(pickTagline(['นั่งเฉย ๆ'], seq(0, 0))).toBe('วันนี้ขอนั่งเฉย ๆ ไปก่อน');
  });

  it('falls back to a fixed line when there are no interests', () => {
    expect(pickTagline([], Math.random)).toBe('Hello world');
  });
});
