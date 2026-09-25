import { describe, it, expect } from 'vitest';
import { toAppleEmbedUrl } from '../src/lib/embed';

describe('toAppleEmbedUrl', () => {
  it('swaps the host to embed.music.apple.com and keeps path + track id', () => {
    expect(
      toAppleEmbedUrl('https://music.apple.com/th/album/%E0%B8%82-3am/6787021893?i=6787021897'),
    ).toBe('https://embed.music.apple.com/th/album/%E0%B8%82-3am/6787021893?i=6787021897');
  });

  it('returns null for any other host', () => {
    expect(toAppleEmbedUrl('https://evil.example.com/th/album/x/1?i=2')).toBeNull();
    expect(toAppleEmbedUrl('https://music.apple.com.evil.example/th/album/x/1')).toBeNull();
  });

  it('returns null for non-https or unparseable input', () => {
    expect(toAppleEmbedUrl('http://music.apple.com/th/album/x/1')).toBeNull();
    expect(toAppleEmbedUrl('javascript:alert(1)')).toBeNull();
    expect(toAppleEmbedUrl('not a url')).toBeNull();
    expect(toAppleEmbedUrl('')).toBeNull();
  });
});
