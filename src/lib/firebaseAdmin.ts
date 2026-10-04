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

  // 2. Fetch from Firestore REST API (Works across all Vercel instances instantly)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fanspicyrabic";
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAz1AHssprR5V0fKJEnhew0riAqGMAf0WU";

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/pages/${encodeURIComponent(slug)}?key=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const doc = await res.json();
      if (doc && doc.fields) {
        const f = doc.fields;
        const adsFields = f.ads?.mapValue?.fields || {};
        
        const pageAds: AdsterraConfig = {
          socialBar: adsFields.socialBar?.stringValue || defaultAds.socialBar || "",
          popunder: adsFields.popunder?.stringValue || defaultAds.popunder || "",
          smartlink: adsFields.smartlink?.stringValue || defaultAds.smartlink || "",
          banner300x250: adsFields.banner300x250?.stringValue || defaultAds.banner300x250 || "",
          banner728x90: adsFields.banner728x90?.stringValue || defaultAds.banner728x90 || "",
          banner320x50: adsFields.banner320x50?.stringValue || defaultAds.banner320x50 || "",
          banner468x60: adsFields.banner468x60?.stringValue || defaultAds.banner468x60 || "",
          banner160x600: adsFields.banner160x600?.stringValue || defaultAds.banner160x600 || "",
          banner160x300: adsFields.banner160x300?.stringValue || defaultAds.banner160x300 || "",
        };

        const pageCtaLink = f.ctaLink?.stringValue || "";
        const effectiveCtaLink = 
          pageCtaLink && pageCtaLink !== "https://t.me"
            ? pageCtaLink
            : (pageAds.smartlink || pageCtaLink || "https://t.me");

        return {
          slug: f.slug?.stringValue || slug,
          title: f.title?.stringValue || "عرض حصري",
          description: f.description?.stringValue || "",
          mediaUrl: f.mediaUrl?.stringValue || "",
          mediaType: (f.mediaType?.stringValue as any) || "image",
          adCode: f.adCode?.stringValue || settings.defaultAdCode || "",
          ads: pageAds,
          ctaText: f.ctaText?.stringValue || "⚡ فتح الفيديو الكامل بجودة 4K الآن",
          ctaLink: effectiveCtaLink,
          views: Number(f.views?.integerValue || 120),
          clicks: Number(f.clicks?.integerValue || 0),
          createdAt: f.createdAt?.stringValue || new Date().toISOString(),
          updatedAt: f.updatedAt?.stringValue || new Date().toISOString(),
        };
      }
    }
  } catch (e) {
    console.warn("Firestore REST API fetch error:", e);
  }

  return null;
}
