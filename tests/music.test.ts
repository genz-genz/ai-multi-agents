import { afterEach, describe, expect, it, vi } from 'vitest';

const SONG_A = { name: 'Song A', artistName: 'Artist A', url: 'https://music.apple.com/th/album/1' };
const SONG_B = { name: 'Song B', artistName: 'Artist B', url: 'https://music.apple.com/th/album/2' };

function okChart(items: unknown[]) {
  return { ok: true, status: 200, json: async () => ({ feed: { results: items } }) };
}

function statusResponse(status: number) {
  return { ok: false, status, json: async () => ({}) };
}

/**
 * Each test gets a fresh module instance via vi.resetModules + dynamic import,
 * so the module-level cache starts empty and cannot leak between tests.
 */
async function loadModule() {
  vi.resetModules();
  return await import('../src/lib/music');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('getRandomSong', () => {
  it('returns a validated song from the chart on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okChart([SONG_A]));
    vi.stubGlobal('fetch', fetchMock);

    const { getRandomSong } = await loadModule();
    const song = await getRandomSong();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(song).toEqual({ name: 'Song A', artist: 'Artist A', url: SONG_A.url });
  });

  it('returns null on non-200 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statusResponse(500)));

    const { getRandomSong } = await loadModule();
    expect(await getRandomSong()).toBeNull();
  });

  it('returns null when the request times out', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation timed out', 'TimeoutError'))
    );

    const { getRandomSong } = await loadModule();
    expect(await getRandomSong()).toBeNull();
  });

  it('returns null when the payload is not valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } })
    );

    const { getRandomSong } = await loadModule();
    expect(await getRandomSong()).toBeNull();
  });

  it('returns null when results are empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okChart([])));

    const { getRandomSong } = await loadModule();
    expect(await getRandomSong()).toBeNull();
  });

  it('drops items that fail validation (bad url, empty fields)', async () => {
    const items = [
      { name: 'Bad URL', artistName: 'X', url: 'http://example.com/song' },
      { name: '', artistName: 'X', url: 'https://music.apple.com/th/album/3' },
      { name: 'No Artist', url: 'https://music.apple.com/th/album/4' },
      SONG_A,
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okChart(items)));

    const { getRandomSong } = await loadModule();
    expect(await getRandomSong()).toEqual({ name: 'Song A', artist: 'Artist A', url: SONG_A.url });
  });

  it('falls back to the stale cache when a refresh fails', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(okChart([SONG_A]));
    vi.stubGlobal('fetch', fetchMock);

    const { getRandomSong } = await loadModule();
    expect(await getRandomSong()).toEqual({ name: 'Song A', artist: 'Artist A', url: SONG_A.url });

    // Past the TTL, the next call must refresh — make that refresh fail.
    vi.advanceTimersByTime(61 * 60 * 1000);
    fetchMock.mockRejectedValue(new Error('network down'));
    expect(await getRandomSong()).toEqual({ name: 'Song A', artist: 'Artist A', url: SONG_A.url });
  });

  it('does not re-fetch within the TTL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okChart([SONG_A, SONG_B]));
    vi.stubGlobal('fetch', fetchMock);

    const { getRandomSong } = await loadModule();
    const first = await getRandomSong();
    const second = await getRandomSong();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    // Both picks come from the same mapped two-song list.
    const mapped = [SONG_A, SONG_B].map((s) => ({ name: s.name, artist: s.artistName, url: s.url }));
    expect(mapped).toContainEqual(first);
    expect(mapped).toContainEqual(second);
  });
});