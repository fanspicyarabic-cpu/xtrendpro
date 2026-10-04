import { LandingPageData, AdminSettings, AdsterraConfig } from "./types";
import { getStoredPageBySlug, getStoredSettings } from "./serverDb";

// Server-side page fetcher for Next.js App Router (generateMetadata & SSR)
export async function getPageForServer(slug: string): Promise<LandingPageData | null> {
  const settings = getStoredSettings();
  const defaultAds: AdsterraConfig = settings.defaultAds || {};

  // 1. Check local persistent server storage first (Instant & 100% reliable)
  try {
    const localDoc = getStoredPageBySlug(slug);
    if (localDoc) {
      // Merge page ads with default site ads from settings
      const mergedAds: AdsterraConfig = {
        socialBar: localDoc.ads?.socialBar || defaultAds.socialBar || "",
        popunder: localDoc.ads?.popunder || defaultAds.popunder || "",
        smartlink: localDoc.ads?.smartlink || defaultAds.smartlink || "",
        banner300x250: localDoc.ads?.banner300x250 || defaultAds.banner300x250 || "",
        banner728x90: localDoc.ads?.banner728x90 || defaultAds.banner728x90 || "",
        banner320x50: localDoc.ads?.banner320x50 || defaultAds.banner320x50 || "",
        banner468x60: localDoc.ads?.banner468x60 || defaultAds.banner468x60 || "",
        banner160x600: localDoc.ads?.banner160x600 || defaultAds.banner160x600 || "",
        banner160x300: localDoc.ads?.banner160x300 || defaultAds.banner160x300 || "",
      };

      // Fallback legacy adCode if present
      const fallbackAdCode = localDoc.adCode || settings.defaultAdCode || "";

      // If ctaLink is default or empty, and Smartlink is provided, use Smartlink!
      const effectiveCtaLink = 
        localDoc.ctaLink && localDoc.ctaLink !== "https://t.me" 
          ? localDoc.ctaLink 
          : (mergedAds.smartlink || localDoc.ctaLink || "https://t.me");

      return {
        ...localDoc,
        adCode: fallbackAdCode,
        ads: mergedAds,
        ctaLink: effectiveCtaLink,
      };
    }
  } catch (e) {
    console.warn("Local serverDb read error:", e);
  }

  // 2. If Firestore REST API is configured via environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (projectId && apiKey && apiKey !== "AIzaSyDummyKeyForDevelopmentModeXTREN999") {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/pages/${slug}?key=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 15 } });
      if (res.ok) {
        const doc = await res.json();
        if (doc && doc.fields) {
          return {
            slug: doc.fields.slug?.stringValue || slug,
            title: doc.fields.title?.stringValue || "عرض حصري",
            description: doc.fields.description?.stringValue || "",
            mediaUrl: doc.fields.mediaUrl?.stringValue || "",
            mediaType: (doc.fields.mediaType?.stringValue as any) || "image",
            adCode: doc.fields.adCode?.stringValue || settings.defaultAdCode || "",
            ads: defaultAds,
            ctaText: doc.fields.ctaText?.stringValue || "⚡ فتح الفيديو الكامل بجودة 4K الآن",
            ctaLink: defaultAds.smartlink || doc.fields.ctaLink?.stringValue || "https://t.me",
            createdAt: doc.fields.createdAt?.stringValue || new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn("Firestore REST API fetch error:", e);
    }
  }

  return null;
}
