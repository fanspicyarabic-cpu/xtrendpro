/**
 * Intelligent Media URL Resolver & Auto-Detector
 * Automatically detects and converts web sharing links
 * (Videy.co, Catbox, Streamable, YouTube, Google Drive, Dropbox, direct MP4/Images)
 * to high-performance direct playable streams or clean embeds.
 */

export type ResolvedKind = "video" | "image" | "embed";

export interface ResolvedMediaInfo {
  url: string;               // Direct media stream or image URL
  embedUrl?: string;         // Iframe embed URL (for YouTube, Streamable, Vimeo, Drive)
  kind: ResolvedKind;        // "video" | "image" | "embed"
  posterUrl?: string;        // Optional preview poster / thumbnail
  platform: string;          // Detected platform label
  requiresNoReferrer: boolean; // Needs referrerPolicy="no-referrer" (crucial for Videy / CDNs)
}

/**
 * Detects whether a given URL is a video or image.
 * Useful for real-time automatic form field switching.
 */
export function detectMediaType(rawUrl: string): "video" | "image" {
  if (!rawUrl) return "image";
  const url = rawUrl.trim().toLowerCase();

  // Known video hosting domains
  if (
    url.includes("videy.co") ||
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("streamable.com") ||
    url.includes("catbox.moe") ||
    url.includes("vimeo.com") ||
    url.includes("dailymotion.com") ||
    url.includes("tiktok.com") ||
    url.includes("redgifs.com")
  ) {
    return "video";
  }

  // Video extensions
  if (
    url.match(/\.(mp4|webm|mov|m4v|m3u8|ogg|ogv|mkv|avi|flv|ts)(\?.*)?$/i) ||
    url.includes(".mp4?") ||
    url.includes(".webm?")
  ) {
    return "video";
  }

  // Keywords indicative of video
  if (
    url.includes("/video/") ||
    url.includes("/watch?") ||
    url.includes("/shorts/") ||
    url.includes("/v/") ||
    url.includes("type=video")
  ) {
    return "video";
  }

  // Image extensions
  if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|ico)(\?.*)?$/i)) {
    return "image";
  }

  // Default fallback
  return "image";
}

/**
 * Full media resolver with platform-specific conversions
 */
export function resolveMediaInfo(rawUrl: string): ResolvedMediaInfo {
  if (!rawUrl) {
    return {
      url: "",
      kind: "image",
      platform: "unknown",
      requiresNoReferrer: false,
    };
  }

  const clean = rawUrl.trim();

  // 1. Videy.co: convert web view to direct CDN MP4/MOV stream
  const videyMatch =
    clean.match(/videy\.co\/v\/\?id=([a-zA-Z0-9_-]+)/i) ||
    clean.match(/videy\.co\/v\?id=([a-zA-Z0-9_-]+)/i) ||
    clean.match(/videy\.co\/([a-zA-Z0-9_-]+)(?:\.html)?$/i) ||
    clean.match(/cdn\.videy\.co\/([a-zA-Z0-9_-]+)\.(mp4|mov)/i);

  if (videyMatch && videyMatch[1]) {
    const id = videyMatch[1];
    const detectedExt = videyMatch[2];
    const ext = detectedExt || (id.length === 9 && id.endsWith("2") ? "mov" : "mp4");
    return {
      url: `https://cdn.videy.co/${id}.${ext}`,
      kind: "video",
      platform: "Videy.co",
      requiresNoReferrer: true, // Absolutely essential! CDN rejects requests with Referer
    };
  }

  // 2. YouTube & YouTube Shorts
  const ytMatch =
    clean.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      url: clean,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`,
      posterUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      kind: "embed",
      platform: "YouTube",
      requiresNoReferrer: false,
    };
  }

  // 3. Streamable
  const streamableMatch = clean.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9_-]+)/i);
  if (streamableMatch && streamableMatch[1]) {
    const id = streamableMatch[1];
    return {
      url: clean,
      embedUrl: `https://streamable.com/e/${id}?autoplay=1&muted=1`,
      kind: "embed",
      platform: "Streamable",
      requiresNoReferrer: false,
    };
  }

  // 4. Google Drive
  const gdriveMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1];
    return {
      url: `https://drive.google.com/uc?export=download&id=${fileId}`,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      kind: "embed",
      platform: "Google Drive",
      requiresNoReferrer: false,
    };
  }

  // 5. Dropbox
  if (clean.includes("dropbox.com")) {
    const directDropbox = clean.replace(/([?&])dl=0/i, "$1raw=1").replace(/([?&])dl=1/i, "$1raw=1");
    return {
      url: directDropbox.includes("raw=1") ? directDropbox : `${directDropbox}${directDropbox.includes("?") ? "&" : "?"}raw=1`,
      kind: "video",
      platform: "Dropbox",
      requiresNoReferrer: false,
    };
  }

  // 6. Catbox.moe
  if (clean.includes("catbox.moe")) {
    return {
      url: clean,
      kind: "video",
      platform: "Catbox",
      requiresNoReferrer: true,
    };
  }

  // 7. Vimeo
  const vimeoMatch = clean.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    const vimeoId = vimeoMatch[3];
    return {
      url: clean,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&playsinline=1`,
      kind: "embed",
      platform: "Vimeo",
      requiresNoReferrer: false,
    };
  }

  // 8. Direct Video extensions
  if (clean.match(/\.(mp4|webm|mov|m4v|m3u8|ogg|ogv|mkv|ts)(\?.*)?$/i)) {
    return {
      url: clean,
      kind: "video",
      platform: "Direct Video",
      requiresNoReferrer: true,
    };
  }

  // 9. Direct Image extensions
  if (clean.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|bmp)(\?.*)?$/i)) {
    return {
      url: clean,
      kind: "image",
      platform: "Direct Image",
      requiresNoReferrer: true,
    };
  }

  // General fallback
  const fallbackType = detectMediaType(clean);
  return {
    url: clean,
    kind: fallbackType,
    platform: "External",
    requiresNoReferrer: true,
  };
}

/**
 * Backward compatible function for direct URL resolution
 */
export function resolveMediaUrl(url: string): string {
  if (!url) return "";
  const info = resolveMediaInfo(url);
  return info.embedUrl || info.url;
}
