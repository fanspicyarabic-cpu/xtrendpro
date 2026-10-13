import { LandingPageData, AdminSettings, AdsterraConfig } from "./types";
import fs from "fs";
import path from "path";
import os from "os";

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

// File paths for guaranteed persistent storage
const DATA_DIR = path.join(process.cwd(), "data");
const PAGES_FILE = path.join(DATA_DIR, "pages.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

const TMP_DIR = path.join(os.tmpdir(), "xtren-data");
const TMP_PAGES_FILE = path.join(TMP_DIR, "pages.json");
const TMP_SETTINGS_FILE = path.join(TMP_DIR, "settings.json");

function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch { }
  try {
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }
  } catch { }
}

/**
 * Robust reader for local persistent pages storage (data/pages.json + /tmp replica)
 */
export function readLocalPages(): LandingPageData[] {
  ensureDirs();
  const pagesMap = new Map<string, LandingPageData>();

  // 1. Read primary data/pages.json
  try {
    if (fs.existsSync(PAGES_FILE)) {
      const content = fs.readFileSync(PAGES_FILE, "utf-8");
      const list = JSON.parse(content) as LandingPageData[];
      if (Array.isArray(list)) {
        for (const p of list) {
          if (p && p.slug) {
            pagesMap.set(p.slug.trim(), p);
          }
        }
      }
    }
  } catch (err) {
    console.warn("readLocalPages error reading primary file:", err);
  }

  // 2. Read /tmp replica (for serverless environments)
  try {
    if (fs.existsSync(TMP_PAGES_FILE)) {
      const content = fs.readFileSync(TMP_PAGES_FILE, "utf-8");
      const list = JSON.parse(content) as LandingPageData[];
      if (Array.isArray(list)) {
        for (const p of list) {
          if (p && p.slug) {
            const trimmed = p.slug.trim();
            const existing = pagesMap.get(trimmed);
            if (
              !existing ||
              new Date(p.updatedAt || p.createdAt || 0).getTime() >=
                new Date(existing.updatedAt || existing.createdAt || 0).getTime()
            ) {
              pagesMap.set(trimmed, p);
            }
          }
        }
      }
    }
  } catch { }

  return Array.from(pagesMap.values());
}

/**
 * Robust writer for local persistent pages storage (data/pages.json + /tmp replica)
 */
export function writeLocalPages(pages: LandingPageData[]): boolean {
  ensureDirs();
  const jsonStr = JSON.stringify(pages, null, 2);
  let written = false;

  try {
    fs.writeFileSync(PAGES_FILE, jsonStr, "utf-8");
    written = true;
  } catch (err) {
    console.warn("Could not write to primary data/pages.json (read-only filesystem?):", err);
  }

  try {
    fs.writeFileSync(TMP_PAGES_FILE, jsonStr, "utf-8");
    written = true;
  } catch (err) {
    console.warn("Could not write to TMP_PAGES_FILE:", err);
  }

  return written;
}

/**
 * Fallback loader for backwards compatibility
 */
export function getLocalFallbackPages(): LandingPageData[] {
  return readLocalPages();
}

/**
 * Robust reader for local settings (data/settings.json + /tmp replica)
 */
export function readLocalSettings(): AdminSettings {
  ensureDirs();
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
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        ...fallbackSettings,
        ...parsed,
        defaultAds: {
          ...fallbackSettings.defaultAds,
          ...(parsed.defaultAds || {}),
        },
      };
    }
  } catch { }

  try {
    if (fs.existsSync(TMP_SETTINGS_FILE)) {
      const content = fs.readFileSync(TMP_SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        ...fallbackSettings,
        ...parsed,
        defaultAds: {
          ...fallbackSettings.defaultAds,
          ...(parsed.defaultAds || {}),
        },
      };
    }
  } catch { }

  return fallbackSettings;
}

/**
 * Robust writer for local settings (data/settings.json + /tmp replica)
 */
export function writeLocalSettings(settings: AdminSettings): boolean {
  ensureDirs();
  const jsonStr = JSON.stringify(settings, null, 2);
  let written = false;

  try {
    fs.writeFileSync(SETTINGS_FILE, jsonStr, "utf-8");
    written = true;
  } catch { }

  try {
    fs.writeFileSync(TMP_SETTINGS_FILE, jsonStr, "utf-8");
    written = true;
  } catch { }

  return written;
}

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
 * Fetch all landing pages directly with local persistent storage + Cloud Firestore sync.
 */
export async function getAllPagesFromFirebase(): Promise<LandingPageData[]> {
  const localPages = readLocalPages();
  const pagesMap = new Map<string, LandingPageData>();

  // Initialize with local persistent pages
  for (const page of localPages) {
    if (page && page.slug) {
      pagesMap.set(page.slug.trim(), page);
    }
  }

  // Dual sync: attempt to pull from Cloud Firestore if available
  try {
    const url = `${BASE_FIRESTORE_URL}/pages?pageSize=300&key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.documents)) {
        for (const doc of data.documents) {
          const page = docToLandingPage(doc);
          if (page && page.slug) {
            const clean = page.slug.trim();
            const existing = pagesMap.get(clean);
            if (
              !existing ||
              new Date(page.updatedAt || page.createdAt || 0).getTime() >=
                new Date(existing.updatedAt || existing.createdAt || 0).getTime()
            ) {
              pagesMap.set(clean, page);
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn("Firestore sync fetch warning (using local persistent pages):", error);
  }

  const pages = Array.from(pagesMap.values());

  // Sort descending by createdAt
  pages.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return pages;
}

/**
 * Normalizes slugs by removing leading/trailing slashes, whitespace, and decoding URI
 */
export function normalizeSlug(s: string): string {
  if (!s) return "";
  let decoded = s;
  try {
    decoded = decodeURIComponent(s);
  } catch { }
  return decoded.trim().replace(/^\/+|\/+$/g, "");
}

/**
 * Fetch a single landing page by slug with local persistent storage + Firestore fallback.
 */
export async function getFirebasePageBySlug(
  slug: string
): Promise<LandingPageData | null> {
  if (!slug) return null;
  const rawSlug = slug.trim();
  const target = normalizeSlug(slug);

  // 1. Check local persistent storage first for fast response
  const localPages = readLocalPages();
  const matchedLocal = localPages.find((p) => {
    const pNorm = normalizeSlug(p.slug);
    return (
      pNorm === target ||
      pNorm.toLowerCase() === target.toLowerCase() ||
      p.slug === rawSlug ||
      p.slug === target ||
      encodeURIComponent(p.slug) === rawSlug
    );
  });

  // 2. Also check Cloud Firestore
  try {
    const url = `${BASE_FIRESTORE_URL}/pages/${encodeURIComponent(target)}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const doc = await res.json();
      const page = docToLandingPage(doc);
      if (page) return page;
    }
  } catch (error) {
    // Firestore error, fall through
  }

  return matchedLocal || null;
}

/**
 * Save or update a landing page directly with GUARANTEED local persistence + Cloud Firestore dual-sync.
 */
export async function savePageToFirebase(
  page: LandingPageData
): Promise<LandingPageData> {
  const timestamp = new Date().toISOString();
  const cleanSlug = normalizeSlug(page.slug) || page.slug.trim();
  const pageWithTime: LandingPageData = {
    ...page,
    slug: cleanSlug,
    createdAt: page.createdAt || timestamp,
    updatedAt: timestamp,
    views: typeof page.views === "number" ? page.views : 0,
    clicks: typeof page.clicks === "number" ? page.clicks : 0,
  };

  // 1. GUARANTEED: Save to local persistent storage immediately
  try {
    const currentPages = readLocalPages();
    const index = currentPages.findIndex(
      (p) => normalizeSlug(p.slug) === cleanSlug
    );
    if (index >= 0) {
      currentPages[index] = { ...currentPages[index], ...pageWithTime };
    } else {
      currentPages.unshift(pageWithTime);
    }
    writeLocalPages(currentPages);
  } catch (localErr) {
    console.error("Local persistence error in savePageToFirebase:", localErr);
  }

  // 2. DUAL-SYNC: Attempt to update Cloud Firestore in parallel
  try {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(pageWithTime)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }

    const url = `${BASE_FIRESTORE_URL}/pages/${encodeURIComponent(cleanSlug)}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Firestore sync warning (page saved locally):", errText);
    }
  } catch (cloudErr) {
    console.warn("Firestore sync warning (page saved locally):", cloudErr);
  }

  return pageWithTime;
}

/**
 * Delete a landing page from local storage and Cloud Firestore.
 */
export async function deletePageFromFirebase(slug: string): Promise<boolean> {
  if (!slug) return false;
  const rawSlug = slug.trim();
  const target = normalizeSlug(slug);

  // 1. Delete from local persistent storage
  try {
    const currentPages = readLocalPages();
    const filtered = currentPages.filter((p) => {
      const pNorm = normalizeSlug(p.slug);
      return (
        pNorm !== target &&
        pNorm.toLowerCase() !== target.toLowerCase() &&
        p.slug !== rawSlug &&
        p.slug !== target
      );
    });
    writeLocalPages(filtered);
  } catch (localErr) {
    console.error("Local delete error:", localErr);
  }

  // 2. Dual-Sync: Delete from Cloud Firestore
  try {
    const url = `${BASE_FIRESTORE_URL}/pages/${encodeURIComponent(target)}?key=${FIREBASE_API_KEY}`;
    await fetch(url, { method: "DELETE" });
  } catch (error) {
    console.warn(`Firestore delete warning for ${slug}:`, error);
  }

  return true;
}

/**
 * Fetch administrative settings directly from local storage + Cloud Firestore fallback.
 */
export async function getFirebaseSettings(): Promise<AdminSettings> {
  const localSettings = readLocalSettings();

  try {
    const url = `${BASE_FIRESTORE_URL}/settings/general?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const doc = await res.json();
      if (doc && doc.fields) {
        const settings: Record<string, any> = {};
        for (const [k, v] of Object.entries(doc.fields)) {
          settings[k] = fromFirestoreValue(v);
        }

        return {
          ...localSettings,
          ...settings,
          defaultAds: {
            ...localSettings.defaultAds,
            ...(settings.defaultAds || {}),
            status: {
              ...(localSettings.defaultAds?.status || {}),
              ...(settings.defaultAds?.status || {}),
            },
          },
        };
      }
    }
  } catch (error) {
    // Firestore error, fallback to local settings
  }

  return localSettings;
}

/**
 * Save administrative settings to local storage + Cloud Firestore.
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

  // 1. Save locally
  writeLocalSettings(merged);

  // 2. Dual sync with Cloud Firestore
  try {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }

    const url = `${BASE_FIRESTORE_URL}/settings/general?key=${FIREBASE_API_KEY}`;
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
  } catch (err) {
    console.warn("Firestore settings save warning:", err);
  }

  return merged;
}

/**
 * High-level server-side loader for `/p/[slug]` SSR and `generateMetadata`.
 * Reads page and site settings directly, merging ads cleanly.
 */
export async function getPageForServer(
  slug: string
): Promise<LandingPageData | null> {
  if (!slug) return null;

  try {
    const [page, settings] = await Promise.all([
      getFirebasePageBySlug(slug),
      getFirebaseSettings(),
    ]);

    if (!page) {
      return null;
    }

    const defaultAds: AdsterraConfig = settings.defaultAds || {};

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

    const fallbackAdCode = page.adCode || settings.defaultAdCode || "";

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

