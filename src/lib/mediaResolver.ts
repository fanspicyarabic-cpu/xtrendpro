/**
 * Intelligent Media URL Resolver
 * Automatically converts web sharing links (like Videy.co, etc.)
 * to direct playable MP4 video streams.
 */

export function resolveMediaUrl(url: string): string {
  if (!url) return "";
  const clean = url.trim();

  // 1. Videy.co: convert web view to direct cdn MP4 stream
  const videyMatch = 
    clean.match(/videy\.co\/v\/\?id=([a-zA-Z0-9_-]+)/i) || 
    clean.match(/videy\.co\/v\?id=([a-zA-Z0-9_-]+)/i) ||
    clean.match(/videy\.co\/([a-zA-Z0-9_-]+)(?:\.html)?$/i);

  if (videyMatch && videyMatch[1]) {
    return `https://cdn.videy.co/${videyMatch[1]}.mp4`;
  }

  return clean;
}
