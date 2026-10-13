import { LandingPageData, AdminSettings, AdsterraConfig } from "./types";

const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  "xtren-hub-2026";

const FIREBASE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  "AIzaSyDAHFw2pKa9vrz3wuwdw7JiYFq92592uqM";

const FIRESTORE_DB_ID =
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID ||
  process.env.FIRESTORE_DATABASE_ID ||
  "default";

export const BASE_FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents`;
export { FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIRESTORE_DB_ID };

/**
 * Converts standard JavaScript objects/primitives to Cloud Firestore REST Value structure.
 */
export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === "boolean") {
    return { booleanValue: val };
  }
  if (typeof val === "number") {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue),
      },
    };
  }
  if (typeof val === "object") {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Converts Cloud Firestore REST Value structure back to native JavaScript data.
 */
export function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== "object") return null;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ("mapValue" in val) {
    const res: Record<string, any> = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return null;
}

/**
 * Helper to transform a raw Firestore document to a LandingPageData object.
 */
function docToLandingPage(doc: any): LandingPageData | null {
  if (!doc || !doc.fields) return null;
  const raw: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    raw[k] = fromFirestoreValue(v);
  }

  const slug = raw.slug || (doc.name ? doc.name.split("/").pop() : "");
  if (!slug) return null;

  return {
    slug,
    title: raw.title || "عرض حصري",
    description: raw.description || "",
    mediaUrl: raw.mediaUrl || "",
    mediaType: raw.mediaType === "video" ? "video" : "image",
    adCode: raw.adCode || "",
    ads: raw.ads || {},
    useDefaultAds: raw.useDefaultAds !== undefined ? raw.useDefaultAds : true,
    ctaText: raw.ctaText || "⚡ فتح ومشاهدة الفيديو بالكامل بجودة 4K الآن",
    ctaLink: raw.ctaLink || "https://t.me",
    views: typeof raw.views === "number" ? raw.views : 0,
    clicks: typeof raw.clicks === "number" ? raw.clicks : 0,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
}

/**
/**
 * Fallback loader for data/pages.json in case Firestore is unreachable or empty
 */
export function getLocalFallbackPages(): LandingPageData[] {
  try {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(process.cwd(), "data", "pages.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as LandingPageData[];
    }
  } catch (e) {
    // ignore
  }
  return [];
}

/**
 * Fetch all landing pages directly from Cloud Firestore with local fallback.
 */
export async function getAllPagesFromFirebase(): Promise<LandingPageData[]> {
  const localFallbacks = getLocalFallbackPages();
  try {
    const url = `${BASE_FIRESTORE_URL}/pages?pageSize=300&key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn("Firestore getAllPages fetch failed with status:", res.status);
      return localFallbacks;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.documents)) {
      return localFallbacks;
    }

    const pages: LandingPageData[] = [];
    for (const doc of data.documents) {
      const page = docToLandingPage(doc);
      if (page) pages.push(page);
    }

    // Merge with local fallbacks if not already in Firestore
    for (const fallback of localFallbacks) {
      if (!pages.some((p) => p.slug === fallback.slug)) {
        pages.push(fallback);
      }
    }

    // Sort descending by createdAt
    pages.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return pages;
  } catch (error) {
    console.error("Error fetching pages from Firebase:", error);
    return localFallbacks;
  }
}

/**
 * Fetch a single landing page by slug directly from Cloud Firestore with local fallback.
 */
export async function getFirebasePageBySlug(
  slug: string
): Promise<LandingPageData | null> {
  if (!slug) return null;
  try {
    const url = `${BASE_FIRESTORE_URL}/pages/${encodeURIComponent(slug)}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const doc = await res.json();
      const page = docToLandingPage(doc);
      if (page) return page;
    }
  } catch (error) {
    console.error(`Error fetching page ${slug} from Firebase:`, error);
  }

  // Fallback to local data/pages.json if not found in Firebase
  const fallbacks = getLocalFallbackPages();
  const matched = fallbacks.find((p) => p.slug === slug);
  return matched || null;
}

/**
 * Save or update a landing page directly in Cloud Firestore.
 */
export async function savePageToFirebase(
  page: LandingPageData
): Promise<LandingPageData> {
  const timestamp = new Date().toISOString();
  const pageWithTime: LandingPageData = {
    ...page,
    slug: page.slug.trim(),
    createdAt: page.createdAt || timestamp,
    updatedAt: timestamp,
    views: typeof page.views === "number" ? page.views : 0,
    clicks: typeof page.clicks === "number" ? page.clicks : 0,
  };

  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(pageWithTime)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }

  const url = `${BASE_FIRESTORE_URL}/pages/${encodeURIComponent(pageWithTime.slug)}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to save page to Firebase: ${errText}`);
  }

  return pageWithTime;
}

/**
 * Delete a landing page directly from Cloud Firestore.
 */
export async function deletePageFromFirebase(slug: string): Promise<boolean> {
  if (!slug) return false;
  try {
    const url = `${BASE_FIRESTORE_URL}/pages/${encodeURIComponent(slug)}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error(`Error deleting page ${slug} from Firebase:`, error);
    return false;
  }
}

/**
 * Fetch administrative settings directly from Cloud Firestore (document settings/general).
 */
export async function getFirebaseSettings(): Promise<AdminSettings> {
  const fallbackSettings: AdminSettings = {
    telegramBotToken: "",
    telegramChannelId: "",
    siteBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://trendx-opal.vercel.app",
    defaultAdCode: "",
    defaultAds: {
      allAdsEnabled: true,
      socialBar: "",
      popunder: "",
      smartlink: "",
      banner300x250: "",
      banner728x90: "",
      banner320x50: "",
      banner468x60: "",
      banner160x600: "",
      banner160x300: "",
      nativeBanner: "",
      customAd: "",
      status: {},
    },
  };

  try {
    const url = `${BASE_FIRESTORE_URL}/settings/general?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return fallbackSettings;
    }
    const doc = await res.json();
    if (!doc || !doc.fields) {
      return fallbackSettings;
    }

    const settings: Record<string, any> = {};
    for (const [k, v] of Object.entries(doc.fields)) {
      settings[k] = fromFirestoreValue(v);
    }

    return {
      ...fallbackSettings,
      ...settings,
      defaultAds: {
        ...fallbackSettings.defaultAds,
        ...(settings.defaultAds || {}),
        status: {
          ...(fallbackSettings.defaultAds?.status || {}),
          ...(settings.defaultAds?.status || {}),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching settings from Firebase:", error);
    return fallbackSettings;
  }
}

/**
 * Save administrative settings directly to Cloud Firestore (document settings/general).
 */
export async function saveFirebaseSettings(
  settings: AdminSettings
): Promise<AdminSettings> {
  const current = await getFirebaseSettings();
  const merged: AdminSettings = {
    ...current,
    ...settings,
    defaultAds: {
      ...current.defaultAds,
      ...(settings.defaultAds || {}),
      status: {
        ...(current.defaultAds?.status || {}),
        ...(settings.defaultAds?.status || {}),
      },
    },
  };

  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }

  const url = `${BASE_FIRESTORE_URL}/settings/general?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to save settings to Firebase: ${errText}`);
  }

  return merged;
}

/**
 * High-level server-side loader for `/p/[slug]` SSR and `generateMetadata`.
 * Reads page and site settings directly from Firebase Firestore, merging ads cleanly.
 */
export async function getPageForServer(
  slug: string
): Promise<LandingPageData | null> {
  if (!slug) return null;

  try {
    // 1. Fetch page and settings concurrently from Firebase
    const [page, settings] = await Promise.all([
      getFirebasePageBySlug(slug),
      getFirebaseSettings(),
    ]);

    if (!page) {
      return null;
    }

    const defaultAds: AdsterraConfig = settings.defaultAds || {};

    // 2. Merge page ads with default site ads from Firebase settings
    const mergedAds: AdsterraConfig = {
      allAdsEnabled:
        page.ads?.allAdsEnabled !== undefined
          ? page.ads.allAdsEnabled
          : defaultAds.allAdsEnabled !== undefined
          ? defaultAds.allAdsEnabled
          : true,
      socialBar: page.ads?.socialBar || defaultAds.socialBar || "",
      popunder: page.ads?.popunder || defaultAds.popunder || "",
      smartlink: page.ads?.smartlink || defaultAds.smartlink || "",
      banner300x250: page.ads?.banner300x250 || defaultAds.banner300x250 || "",
      banner728x90: page.ads?.banner728x90 || defaultAds.banner728x90 || "",
      banner320x50: page.ads?.banner320x50 || defaultAds.banner320x50 || "",
      banner468x60: page.ads?.banner468x60 || defaultAds.banner468x60 || "",
      banner160x600: page.ads?.banner160x600 || defaultAds.banner160x600 || "",
      banner160x300: page.ads?.banner160x300 || defaultAds.banner160x300 || "",
      nativeBanner: page.ads?.nativeBanner || defaultAds.nativeBanner || "",
      customAd: page.ads?.customAd || defaultAds.customAd || "",
      status: {
        ...(defaultAds.status || {}),
        ...(page.ads?.status || {}),
      },
    };

    // 3. Fallback adCode if present
    const fallbackAdCode = page.adCode || settings.defaultAdCode || "";

    // 4. Determine effective CTA Link (prioritizing Smartlink if set)
    const effectiveCtaLink =
      page.ctaLink && page.ctaLink !== "https://t.me"
        ? page.ctaLink
        : mergedAds.smartlink || page.ctaLink || "https://t.me";

    return {
      ...page,
      adCode: fallbackAdCode,
      ads: mergedAds,
      ctaLink: effectiveCtaLink,
    };
  } catch (error) {
    console.error(`Error in getPageForServer for slug ${slug}:`, error);
    return null;
  }
}
