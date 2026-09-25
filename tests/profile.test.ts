import { describe, it, expect } from 'vitest';
import { parseProfile } from '../src/lib/profile';

const SAMPLE = `# PROFILE

## Name
Sample

## Headline
Hello

## Tagline
Fixed line

## Bio
First paragraph.

Second paragraph.

## Audience
Everyone

## Interests
- one
- two
- three

## Tone
- ignored
`;

describe('parseProfile', () => {
  it('keeps every Bio paragraph', () => {
    expect(parseProfile(SAMPLE).bio).toBe('First paragraph.\n\nSecond paragraph.');
  });

  it('reads every Interests bullet and stops at the next heading', () => {
    expect(parseProfile(SAMPLE).interests).toEqual(['one', 'two', 'three']);
  });

  it('reads the last section through end of file', () => {
    const p = parseProfile('## Interests\n- a\n- b\n');
    expect(p.interests).toEqual(['a', 'b']);
  });

  it('reads the Tagline section', () => {
    expect(parseProfile(SAMPLE).tagline).toBe('Fixed line');
  });

  it('uses an empty tagline when the section is missing', () => {
    expect(parseProfile('## Name\nX\n').tagline).toBe('');
  });

  it('handles CRLF line endings', () => {
    expect(parseProfile(SAMPLE.replace(/\n/g, '\r\n')).interests).toEqual(['one', 'two', 'three']);
  });
});
