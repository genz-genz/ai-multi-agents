/**
 * "Random song of the day" card data source.
 *
 * Fetches the Thai most-played songs chart from Apple Music's public RSS
 * endpoint (no API key), caches it at module level, and returns one random
 * validated song per call. Designed to never throw: any failure (timeout,
 * non-200, broken JSON, empty results) results in `null` or a stale cached
 * list, so the page can simply hide the card.
 */

export type Song = { name: string; artist: string; url: string };

const ENDPOINT =
  'https://rss.marketingtools.apple.com/api/v2/th/music/most-played/25/songs.json';

/** Cache TTL — the chart's `updated` field changes only a few times a day. */
const TTL_MS = 60 * 60 * 1000;

/** Hard ceiling so a slow Apple response can never hang page rendering. */
const TIMEOUT_MS = 3000;

const URL_PREFIX = 'https://music.apple.com/';

type ChartItem = {
  name?: unknown;
  artistName?: unknown;
  url?: unknown;
};

type CacheEntry = { songs: Song[]; fetchedAt: number };

/** Module-level cache shared by every SSR request in this process. */
let cache: CacheEntry | null = null;

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

async function fetchChart(): Promise<Song[]> {
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

export async function getRandomSong(): Promise<Song | null> {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < TTL_MS) {
    return pickRandom(cache.songs);
  }

  try {
    const songs = await fetchChart();
    // Empty results are treated like a failed refresh: keep stale data if any.
    if (songs.length > 0) {
      cache = { songs, fetchedAt: now };
    }
  } catch {
    // Refresh failed (timeout / non-200 / broken JSON) — fall through to stale.
  }

  if (cache && cache.songs.length > 0) {
    return pickRandom(cache.songs);
  }
  return null;
}