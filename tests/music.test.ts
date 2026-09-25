import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

const SONG_A = { name: 'Song A', artistName: 'Artist A', url: 'https://music.apple.com/th/album/1' };
const SONG_B = { name: 'Song B', artistName: 'Artist B', url: 'https://music.apple.com/th/album/2' };

const mappedA = { name: 'Song A', artist: 'Artist A', url: SONG_A.url };
const mappedAB = [
  { name: 'Song A', artist: 'Artist A', url: SONG_A.url },
  { name: 'Song B', artist: 'Artist B', url: SONG_B.url },
];

// Mirrors the constants in src/lib/music.ts (kept in sync by the tests below).
const TTL_ms = 60 * 60 * 1000;
const WAIT_ms = 1000;
const BACKOFF_ms = 60 * 1000;

function okChart(items: unknown[]) {
  return { ok: true, status: 200, json: async () => ({ feed: { results: items } }) };
}

function statusResponse(status: number) {
  return { ok: false, status, json: async () => ({}) };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Flush pending microtasks so the import-time warm-up settles. */
async function settle() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

type Music = typeof import('../src/lib/music');

/**
 * Load a fresh module instance and put it in a clean, deterministic state:
 * the import-time warm-up is allowed to settle, then __resetForTest wipes
 * its side effects and the mock call history is cleared. No real network —
 * `fetch` is always the stubbed mock.
 */
async function loadFresh(configure?: (fetchMock: Mock) => void) {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  configure?.(fetchMock);
  vi.resetModules();
  const music: Music = await import('../src/lib/music');
  await settle();
  music.__resetForTest();
  fetchMock.mockClear();
  return { music, fetchMock };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.resetModules();
});

describe('getRandomSong', () => {
  it('returns a validated song from the chart on success', async () => {
    const { music, fetchMock } = await loadFresh((m) => m.mockResolvedValue(okChart([SONG_A])));

    expect(await music.getRandomSong()).toEqual(mappedA);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null on non-200 response', async () => {
    const { music } = await loadFresh((m) => m.mockResolvedValue(statusResponse(500)));

    expect(await music.getRandomSong()).toBeNull();
  });

  it('returns null when the request times out', async () => {
    const { music } = await loadFresh((m) =>
      m.mockRejectedValue(new DOMException('The operation timed out', 'TimeoutError'))
    );

    expect(await music.getRandomSong()).toBeNull();
  });

  it('returns null when the payload is not valid JSON', async () => {
    const { music } = await loadFresh((m) =>
      m.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } })
    );

    expect(await music.getRandomSong()).toBeNull();
  });

  it('returns null when results are empty', async () => {
    const { music } = await loadFresh((m) => m.mockResolvedValue(okChart([])));

    expect(await music.getRandomSong()).toBeNull();
  });

  it('drops items that fail validation (bad url, empty fields)', async () => {
    const items = [
      { name: 'Bad URL', artistName: 'X', url: 'http://example.com/song' },
      { name: '', artistName: 'X', url: 'https://music.apple.com/th/album/3' },
      { name: 'No Artist', url: 'https://music.apple.com/th/album/4' },
      SONG_A,
    ];
    const { music } = await loadFresh((m) => m.mockResolvedValue(okChart(items)));

    expect(await music.getRandomSong()).toEqual(mappedA);
  });

  it('serves stale cache instantly and refreshes in the background', async () => {
    vi.useFakeTimers();
    const { music, fetchMock } = await loadFresh((m) => m.mockResolvedValue(okChart([SONG_A])));

    expect(await music.getRandomSong()).toEqual(mappedA); // fills the cache

    // Past the TTL: the answer must not wait for the (never-resolving) refresh.
    vi.advanceTimersByTime(TTL_ms + 61 * 60 * 1000);
    fetchMock.mockReturnValue(new Promise(() => {})); // refresh would hang forever

    const song = await music.getRandomSong();
    expect(song).toEqual(mappedA); // stale answer, returned immediately
    expect(fetchMock).toHaveBeenCalledTimes(2); // background refresh started
  });

  it('returns null within ~1s on cold start, then serves the next request from cache', async () => {
    vi.useFakeTimers();
    const slow = deferred<{ ok: boolean; status: number; json: () => Promise<unknown> }>();
    const { music, fetchMock } = await loadFresh((m) => m.mockReturnValue(slow.promise));

    const first = music.getRandomSong();
    await vi.advanceTimersByTimeAsync(WAIT_ms);
    expect(await first).toBeNull(); // gave up at ~1s while fetch kept running
    expect(fetchMock).toHaveBeenCalledTimes(1);

    slow.resolve(okChart([SONG_A]));
    await settle();

    expect(await music.getRandomSong()).toEqual(mappedA); // next visitor gets the card
    expect(fetchMock).toHaveBeenCalledTimes(1); // no extra fetch was needed
  });

  it('single-flight: concurrent requests share one fetch', async () => {
    vi.useFakeTimers();
    const slow = deferred<{ ok: boolean; status: number; json: () => Promise<unknown> }>();
    const { music, fetchMock } = await loadFresh((m) => m.mockReturnValue(slow.promise));

    const first = music.getRandomSong();
    const second = music.getRandomSong();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    slow.resolve(okChart([SONG_A]));
    await vi.advanceTimersByTimeAsync(WAIT_ms);
    expect(await first).toEqual(mappedA);
    expect(await second).toEqual(mappedA);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not refetch during the backoff window after a failure', async () => {
    vi.useFakeTimers();
    const { music, fetchMock } = await loadFresh((m) => m.mockRejectedValue(new Error('network down')));

    expect(await music.getRandomSong()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockClear();

    expect(await music.getRandomSong()).toBeNull(); // inside backoff: no new fetch, no wait
    expect(fetchMock).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(BACKOFF_ms + 1000);
    fetchMock.mockResolvedValue(okChart([SONG_A]));
    expect(await music.getRandomSong()).toEqual(mappedA);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('warms up at import so the first caller is served from cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okChart([SONG_A]));
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();
    const music: Music = await import('../src/lib/music');
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1); // warm-up fired at import

    expect(await music.getRandomSong()).toEqual(mappedA);
    expect(fetchMock).toHaveBeenCalledTimes(1); // served from cache, no extra fetch
  });

  it('falls back to the stale cache when a refresh fails', async () => {
    vi.useFakeTimers();
    const { music, fetchMock } = await loadFresh((m) => m.mockResolvedValue(okChart([SONG_A])));

    expect(await music.getRandomSong()).toEqual(mappedA);

    vi.advanceTimersByTime(TTL_ms + 61 * 60 * 1000);
    fetchMock.mockRejectedValue(new Error('network down'));
    expect(await music.getRandomSong()).toEqual(mappedA); // stale-on-error
  });

  it('does not re-fetch within the TTL', async () => {
    const { music, fetchMock } = await loadFresh((m) => m.mockResolvedValue(okChart([SONG_A, SONG_B])));

    const first = await music.getRandomSong();
    const second = await music.getRandomSong();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mappedAB).toContainEqual(first);
    expect(mappedAB).toContainEqual(second);
  });
});