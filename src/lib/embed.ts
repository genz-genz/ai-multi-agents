/**
 * Apple Music embed URL for the song card player (DECISIONS D11).
 *
 * The chart link (`https://music.apple.com/th/album/<name>/<id>?i=<track>`)
 * becomes an embeddable single-song player just by swapping the host —
 * no API call or key. Anything that is not an https music.apple.com URL
 * returns null so the card can skip the player instead of framing an
 * unexpected origin.
 */
export function toAppleEmbedUrl(songUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(songUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'music.apple.com') return null;
  url.hostname = 'embed.music.apple.com';
  return url.toString();
}
