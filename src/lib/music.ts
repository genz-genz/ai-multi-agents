/**
 * "Random song of the day" card data source.
 *
 * Fetches the Thai most-played songs chart from Apple Music's public RSS
 * endpoint (no API key), caches it at module level, and returns one random
 * validated song per call. Never throws and never blocks the page longer
 * than WAIT_MS:
 *
 * - Warm-up: the first fetch starts as soon as this module is imported.
 * - Stale-while-revalidate: any cached list (even expired) is answered
 *   instantly while a background refresh runs for the next visitor.
 * - Single-flight: only one chart fetch runs at a time; concurrent
 *   requests share the same promise.
 * - Backoff: after a failed refresh, no new fetch for BACKOFF_MS.
 * - Every failure path (timeout, non-200, broken JSON, empty results)
 *   ends in `null` or a stale cached list, so the UI can hide the card.
 */

export type Song = { name: string; artist: string; url: string };

const ENDPOINT =
  'https://rss.marketingtools.apple.com/api/v2/th/music/most-played/25/songs.json';

/** Cache TTL — the chart's `updated` field changes only a few times a day. */
const TTL_MS = 60 * 60 * 1000;

/** Chart fetch ceiling — the page no longer waits on this, so it can be generous. */
const TIMEOUT_MS = 8000;

/**
 * Max time a request waits for the chart when the cache is completely
 * empty (cold start). Past this the caller gets `null`, but the fetch
 * keeps running and fills the cache for the next visitor.
 */
const WAIT_MS = 1000;

/** After a failed refresh, do not hit Apple again for this long. */
const BACKOFF_MS = 60 * 1000;

const URL_PREFIX = 'https://music.apple.com/';

type ChartItem = {
  name?: unknown;
  artistName?: unknown;
  url?: unknown;
};

type CacheEntry = { songs: Song[]; fetchedAt: number };

/** Module-level state shared by every SSR request in this process. */
let cache: CacheEntry | null = null;
let inFlight: Promise<Song[] | null> | null = null;
let nextAttemptAt = 0;
/** Incremented on every refresh start and by __resetForTest — stale callbacks no-op. */
let generation = 0;

function isPlainString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidSong(item: ChartItem): boolean {
  return (
    isPlainString(item.name) &&
    isPlainString(item.artistName) &&
    isPlainString(item.url) &&
    item.url.startsWith(URL_PREFIX)
  );
}

async function doFetch(): Promise<Song[]> {
  const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`chart request failed with status ${res.status}`);
  }
  const data = (await res.json()) as { feed?: { results?: unknown } };
  const results = data?.feed?.results;
  if (!Array.isArray(results)) {
    throw new Error('unexpected chart payload shape');
  }
  return results
    .filter((item): item is ChartItem => typeof item === 'object' && item !== null)
    .filter(isValidSong)
    .map((item) => ({
      name: item.name as string,
      artist: item.artistName as string,
      url: item.url as string,
    }));
}

function pickRandom(songs: Song[]): Song {
  const index = Math.floor(Math.random() * songs.length);
  const song = songs[index];
  // Caller contract: songs is never empty when this runs.
  return song as Song;
}

/** Resolves to null after WAIT_MS — used only to bound the cold-start wait. */
function sleep(ms: number): Promise<null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    // Do not keep the process alive just for this race loser.
    (timer as { unref?: () => void }).unref?.();
  });
}

/**
 * Single-flight refresh. Returns the in-flight promise, starts a new fetch,
 * or null when backing off. Never rejects; populates the cache on success.
 */
function refresh(): Promise<Song[] | null> | null {
  if (inFlight) return inFlight;
  if (Date.now() < nextAttemptAt) return null;

  const gen = ++generation;
  const promise: Promise<Song[] | null> = (async () => {
    try {
      const songs = await doFetch();
      if (gen !== generation) return null; // state was reset mid-flight
      if (songs.length > 0) {
        cache = { songs, fetchedAt: Date.now() };
        return songs;
      }
      // Empty chart = failure: back off instead of re-hitting Apple on every
      // request. Any stale cache stays untouched for stale-on-error serving.
      if (gen === generation) {
        nextAttemptAt = Date.now() + BACKOFF_MS;
      }
      return null;
    } catch {
      if (gen === generation) {
        nextAttemptAt = Date.now() + BACKOFF_MS;
      }
      return null;
    } finally {
      if (gen === generation) {
        inFlight = null;
      }
    }
  })();
  inFlight = promise;
  return promise;
}

export async function getRandomSong(): Promise<Song | null> {
  const now = Date.now();

  if (cache && cache.songs.length > 0) {
    if (now - cache.fetchedAt < TTL_MS) {
      return pickRandom(cache.songs);
    }
    // Stale-while-revalidate: answer instantly from the stale list and let
    // the refresh finish in the background for the next visitor.
    void refresh();
    return pickRandom(cache.songs);
  }

  // No usable cache (cold start): give the in-flight refresh a short chance
  // to land, but never hold the page hostage to Apple's latency.
  const refreshPromise = refresh();
  if (!refreshPromise) return null; // backing off after a recent failure
  const raced = await Promise.race([refreshPromise, sleep(WAIT_MS)]);
  return raced && raced.length > 0 ? pickRandom(raced) : null;
}

/** Test-only: wipe all module state so each test starts cold. */
export function __resetForTest(): void {
  generation++;
  cache = null;
  inFlight = null;
  nextAttemptAt = 0;
}

/**
 * Explicit warm-up entry point — single-flight and never rejects. Called by
 * any code that wants to start the chart fetch early (e.g. at boot). Safe to
 * call repeatedly: refresh() deduplicates concurrent calls.
 */
export function warmUpChart(): void {
  void refresh();
}

// Warm-up on plain module import too (dev server / any direct importer).
// refresh() never rejects, so this cannot produce an unhandled rejection.
void warmUpChart();