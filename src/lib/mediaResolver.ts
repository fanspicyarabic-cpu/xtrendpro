/**
 * Intelligent Media URL Resolver & Auto-Detector
 * Automatically detects and converts web sharing links
 * (ImgBB, Videy.co, Catbox, Streamable, YouTube, Google Drive, Dropbox, direct MP4/Images)
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
 * Extract clean URL from potential HTML/BBCode/Markdown embeds
 */
export function cleanMediaInputUrl(rawInput: string): string {
  if (!rawInput) return "";
  let val = rawInput.trim();

  // If pasted HTML <img ... src="URL" ...>
  const srcMatch = val.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1];
  }

  // If pasted BBCode [img]URL[/img]
  const bbMatch = val.match(/\[img\](https?:\/\/[^\]]+)\[\/img\]/i);
  if (bbMatch && bbMatch[1]) {
    return bbMatch[1];
  }

  // If pasted markdown ![alt](URL)
  const mdMatch = val.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/i);
  if (mdMatch && mdMatch[1]) {
    return mdMatch[1];
  }

  // If starts with <a href="URL">
  const hrefMatch = val.match(/href=["'](https?:\/\/[^"']+)["']/i);
  if (hrefMatch && hrefMatch[1] && (val.startsWith("<a") || val.startsWith("<A"))) {
    return hrefMatch[1];
  }

  // Strip wrapping quotes
  val = val.replace(/^["']+|["']+$/g, "");

  return val;
}

/**
 * Detects whether a given URL is a video or image.
 * Useful for real-time automatic form field switching.
 */
export function detectMediaType(rawUrl: string): "video" | "image" {
  if (!rawUrl) return "image";
  const url = cleanMediaInputUrl(rawUrl).toLowerCase();

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

  // Known image hosts & extensions (ImgBB, Postimages, Imgur, etc.)
  if (
    url.includes("ibb.co") ||
    url.includes("imgbb.com") ||
    url.includes("postimg.cc") ||
    url.includes("postimages.org") ||
    url.includes("imgur.com") ||
    url.includes("unsplash.com") ||
    url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|ico)(\?.*)?$/i)
  ) {
    return "image";
  }

  // Default fallback
  return "image";
}

const ibbCache = new Map<string, string>();

/**
 * Resolves an ImgBB link (whether direct i.ibb.co or viewer ibb.co/id)
 * to a 100% playable direct image URL
 */
export async function resolveIbbUrl(rawUrl: string): Promise<string> {
  if (!rawUrl) return "";
  const cleaned = cleanMediaInputUrl(rawUrl);

  // If already direct image link on i.ibb.co
  if (cleaned.includes("i.ibb.co/")) {
    return cleaned;
  }

  // If not an ibb.co link, return as is
  if (!cleaned.includes("ibb.co/") && !cleaned.includes("imgbb.com/")) {
    return cleaned;
  }

  // Check in-memory cache
  if (ibbCache.has(cleaned)) {
    return ibbCache.get(cleaned)!;
  }

  try {
    const res = await fetch(cleaned, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
      },
      next: { revalidate: 86400 }, // Cache 24 hours
    });

    if (res.ok) {
      const html = await res.text();

      // Priority 1: <meta property="og:image" content="https://i.ibb.co/...">
      const ogMatch =
        html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      if (ogMatch && ogMatch[1] && ogMatch[1].startsWith("http")) {
        ibbCache.set(cleaned, ogMatch[1]);
        return ogMatch[1];
      }

      // Priority 2: <meta name="twitter:image" content="...">
      const twMatch =
        html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (twMatch && twMatch[1] && twMatch[1].startsWith("http")) {
        ibbCache.set(cleaned, twMatch[1]);
        return twMatch[1];
      }

      // Priority 3: <link rel="image_src" href="...">
      const linkMatch = html.match(/<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i);
      if (linkMatch && linkMatch[1] && linkMatch[1].startsWith("http")) {
        ibbCache.set(cleaned, linkMatch[1]);
        return linkMatch[1];
      }

      // Priority 4: Direct regex match for i.ibb.co in HTML
      const directMatch = html.match(/https:\/\/i\.ibb\.co\/[a-zA-Z0-9_\-\.\/]+/i);
      if (directMatch && directMatch[0]) {
        ibbCache.set(cleaned, directMatch[0]);
        return directMatch[0];
      }
    }
  } catch (err) {
    console.warn("Could not resolve ibb.co viewer url to direct image:", err);
  }

  return cleaned;
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

  const clean = cleanMediaInputUrl(rawUrl);

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

  // 8. ImgBB (direct i.ibb.co or viewer ibb.co)
  if (clean.includes("ibb.co") || clean.includes("imgbb.com")) {
    return {
      url: clean,
      kind: "image",
      platform: "ImgBB",
      requiresNoReferrer: true,
    };
  }

  // 9. Direct Video extensions
  if (clean.match(/\.(mp4|webm|mov|m4v|m3u8|ogg|ogv|mkv|ts)(\?.*)?$/i)) {
    return {
      url: clean,
      kind: "video",
      platform: "Direct Video",
      requiresNoReferrer: true,
    };
  }

  // 10. Direct Image extensions
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
