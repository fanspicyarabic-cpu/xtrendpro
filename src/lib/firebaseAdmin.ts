import { LandingPageData, AdminSettings, AdsterraConfig } from "./types";
import fs from "fs";
import path from "path";
import os from "os";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

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

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "484480782636",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:484480782636:web:15e117b334a79469e2dc89",
};

let app: FirebaseApp;
let db: Firestore;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app, FIRESTORE_DB_ID);
} catch (e) {
  console.error("Firebase Admin SDK initialization error:", e);
}

// File paths for persistent storage backup
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
            pagesMap.set(normalizeSlug(p.slug), p);
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
            const key = normalizeSlug(p.slug);
            const existing = pagesMap.get(key);
            if (
              !existing ||
              new Date(p.updatedAt || p.createdAt || 0).getTime() >=
                new Date(existing.updatedAt || existing.createdAt || 0).getTime()
            ) {
              pagesMap.set(key, p);
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
  } catch { }

  try {
    fs.writeFileSync(TMP_PAGES_FILE, jsonStr, "utf-8");
    written = true;
  } catch { }

  return written;
}

export function getLocalFallbackPages(): LandingPageData[] {
  return readLocalPages();
}

/**
 * Default Adsterra Configuration with verified codes
 */
export const DEFAULT_ADSTERRA_CONFIG: AdsterraConfig = {
  allAdsEnabled: true,
  socialBar: "<script src=\"https://watchingprefecture.com/f3/63/59/f36359d33d0808e2511227bb83a483e5.js\"></script>",
  popunder: "<script src=\"https://watchingprefecture.com/ec/91/5b/ec915bc484b625a9ef953e83069c82a6.js\"></script>",
  smartlink: "https://watchingprefecture.com/n2ad63zrfi?key=675129b78f62605d0e476f7e4538d4a2",
  nativeBanner: "<script async=\"async\" data-cfasync=\"false\" src=\"https://watchingprefecture.com/2dc18414b35656f629d293277282a4c4/invoke.js\"></script>\n<div id=\"container-2dc18414b35656f629d293277282a4c4\"></div>",
  banner300x250: "<script>\n  atOptions = {\n    'key' : '57482a419ad24793e62e2c975c1911de',\n    'format' : 'iframe',\n    'height' : 250,\n    'width' : 300,\n    'params' : {}\n  };\n</script>\n<script src=\"https://watchingprefecture.com/57482a419ad24793e62e2c975c1911de/invoke.js\"></script>",
  banner728x90: "<script>\n  atOptions = {\n    'key' : 'b7be66f54fe49fde8fa4734401c764e1',\n    'format' : 'iframe',\n    'height' : 90,\n    'width' : 728,\n    'params' : {}\n  };\n</script>\n<script src=\"https://watchingprefecture.com/b7be66f54fe49fde8fa4734401c764e1/invoke.js\"></script>",
  banner320x50: "<script>\n  atOptions = {\n    'key' : '111eb5a61479d619e8fce3bf5045cbca',\n    'format' : 'iframe',\n    'height' : 50,\n    'width' : 320,\n    'params' : {}\n  };\n</script>\n<script src=\"https://watchingprefecture.com/111eb5a61479d619e8fce3bf5045cbca/invoke.js\"></script>",
  banner468x60: "<script>\n  atOptions = {\n    'key' : 'c43c439d52e026f6d1b556c49b4d6108',\n    'format' : 'iframe',\n    'height' : 60,\n    'width' : 468,\n    'params' : {}\n  };\n</script>\n<script src=\"https://watchingprefecture.com/c43c439d52e026f6d1b556c49b4d6108/invoke.js\"></script>",
  banner160x600: "<script>\n  atOptions = {\n    'key' : '3a64719334635e5dbcde0593407b9460',\n    'format' : 'iframe',\n    'height' : 600,\n    'width' : 160,\n    'params' : {}\n  };\n</script>\n<script src=\"https://watchingprefecture.com/3a64719334635e5dbcde0593407b9460/invoke.js\"></script>",
  banner160x300: "<script>\n  atOptions = {\n    'key' : '8a9df504bf537ebc7d6a198f3eaa083c',\n    'format' : 'iframe',\n    'height' : 300,\n    'width' : 160,\n    'params' : {}\n  };\n</script>\n<script src=\"https://watchingprefecture.com/8a9df504bf537ebc7d6a198f3eaa083c/invoke.js\"></script>",
  customAd: "",
  status: {
    socialBar: true,
    popunder: true,
    smartlink: true,
    nativeBanner: true,
    banner300x250: true,
    banner728x90: true,
    banner320x50: true,
    banner468x60: true,
    banner160x600: true,
    banner160x300: true,
  },
};

/**
 * Robust reader for local settings (data/settings.json + /tmp replica)
 */
export function readLocalSettings(): AdminSettings {
  ensureDirs();
  const fallbackSettings: AdminSettings = {
    adminPassword: process.env.ADMIN_PASSWORD || "0946506263",
    telegramBotToken: "admin123",
    telegramChannelId: "admin",
    siteBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    defaultAdCode: "",
    defaultAds: { ...DEFAULT_ADSTERRA_CONFIG },
  };

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        ...fallbackSettings,
        ...parsed,
        defaultAds: {
          ...DEFAULT_ADSTERRA_CONFIG,
          ...(parsed.defaultAds || {}),
          status: {
            ...DEFAULT_ADSTERRA_CONFIG.status,
            ...(parsed.defaultAds?.status || {}),
          },
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
          ...DEFAULT_ADSTERRA_CONFIG,
          ...(parsed.defaultAds || {}),
          status: {
            ...DEFAULT_ADSTERRA_CONFIG.status,
            ...(parsed.defaultAds?.status || {}),
          },
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
 * Fetch all landing pages directly via official Firebase Firestore SDK
 * with persistent local storage dual-sync.
 */
export async function getAllPagesFromFirebase(): Promise<LandingPageData[]> {
  const pagesMap = new Map<string, LandingPageData>();

  // 1. Direct fetch from Cloud Firestore database
  try {
    if (db) {
      const colRef = collection(db, "pages");
      const snapshot = await getDocs(colRef);
      snapshot.forEach((d) => {
        const raw = d.data() as LandingPageData;
        const slug = raw.slug || d.id;
        if (slug) {
          const norm = normalizeSlug(slug);
          pagesMap.set(norm, {
            ...raw,
            slug: norm || slug,
          });
        }
      });
    }
  } catch (error) {
    console.error("Firestore SDK getAllPagesFromFirebase error:", error);
  }

  // 2. Merge with local persistent storage (ensures no page is ever lost)
  const localList = readLocalPages();
  for (const page of localList) {
    if (page && page.slug) {
      const norm = normalizeSlug(page.slug);
      const existing = pagesMap.get(norm);
      if (
        !existing ||
        new Date(page.updatedAt || page.createdAt || 0).getTime() >
          new Date(existing.updatedAt || existing.createdAt || 0).getTime()
      ) {
        pagesMap.set(norm, page);
      }
    }
  }

  const pages = Array.from(pagesMap.values());

  // Sort descending by createdAt
  pages.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  // Sync to local file storage for reliable backup
  if (pages.length > 0) {
    writeLocalPages(pages);
  }

  return pages;
}

/**
 * Fetch a single landing page by slug via official Firestore SDK + local fallback.
 */
export async function getFirebasePageBySlug(
  slug: string
): Promise<LandingPageData | null> {
  if (!slug) return null;
  const rawSlug = slug.trim();
  const target = normalizeSlug(slug);

  // 1. Query Cloud Firestore
  try {
    if (db) {
      // Try normalized slug first
      let docRef = doc(db, "pages", target);
      let snap = await getDoc(docRef);

      // If not found, try raw slug
      if (!snap.exists() && rawSlug !== target) {
        docRef = doc(db, "pages", rawSlug);
        snap = await getDoc(docRef);
      }

      if (snap.exists()) {
        const data = snap.data() as LandingPageData;
        return {
          ...data,
          slug: data.slug || target,
        };
      }
    }
  } catch (error) {
    console.warn("Firestore getFirebasePageBySlug warning:", error);
  }

  // 2. Fallback to local persistent storage
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

  return matchedLocal || null;
}

/**
 * Save or update a landing page directly in Cloud Firestore + local storage.
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

  // 1. Direct write to Cloud Firestore
  try {
    if (db) {
      const docRef = doc(db, "pages", cleanSlug);
      await setDoc(docRef, pageWithTime, { merge: true });
    }
  } catch (cloudErr) {
    console.error("Firestore savePageToFirebase error:", cloudErr);
  }

  // 2. Guaranteed local persistent storage write
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

  return pageWithTime;
}

/**
 * Delete a landing page from Cloud Firestore and local storage.
 */
export async function deletePageFromFirebase(slug: string): Promise<boolean> {
  if (!slug) return false;
  const rawSlug = slug.trim();
  const target = normalizeSlug(slug);

  // 1. Delete from Cloud Firestore
  try {
    if (db) {
      await deleteDoc(doc(db, "pages", target));
      if (rawSlug !== target) {
        await deleteDoc(doc(db, "pages", rawSlug)).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Firestore deletePageFromFirebase error:", error);
  }

  // 2. Delete from local storage
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
    console.error("Local persistence delete error:", localErr);
  }

  return true;
}

/**
 * Fetch administrative settings directly from Cloud Firestore + local storage fallback.
 * Guarantees that default Adsterra codes are NEVER blank.
 */
export async function getFirebaseSettings(): Promise<AdminSettings> {
  const localSettings = readLocalSettings();

  try {
    if (db) {
      const docRef = doc(db, "settings", "general");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const remoteSettings = snap.data() as AdminSettings;

        // Ensure defaultAds is properly populated and not blank
        const mergedDefaultAds: AdsterraConfig = {
          ...DEFAULT_ADSTERRA_CONFIG,
          ...(localSettings.defaultAds || {}),
          ...(remoteSettings.defaultAds || {}),
          status: {
            ...DEFAULT_ADSTERRA_CONFIG.status,
            ...(localSettings.defaultAds?.status || {}),
            ...(remoteSettings.defaultAds?.status || {}),
          },
        };

        // If any slot is empty string in remote, use default verified Adsterra codes
        for (const key of Object.keys(DEFAULT_ADSTERRA_CONFIG) as (keyof AdsterraConfig)[]) {
          if (key === "status" || key === "allAdsEnabled" || key === "customAd") continue;
          const remoteVal = (remoteSettings.defaultAds as any)?.[key];
          if (!remoteVal || (typeof remoteVal === "string" && !remoteVal.trim())) {
            (mergedDefaultAds as any)[key] = (DEFAULT_ADSTERRA_CONFIG as any)[key];
          }
        }

        const merged: AdminSettings = {
          ...localSettings,
          ...remoteSettings,
          adminPassword: remoteSettings.adminPassword || localSettings.adminPassword || "0946506263",
          defaultAds: mergedDefaultAds,
        };

        // Cache locally
        writeLocalSettings(merged);
        return merged;
      }
    }
  } catch (error) {
    console.warn("Firestore getFirebaseSettings error (using local):", error);
  }

  return localSettings;
}

/**
 * Save administrative settings to Cloud Firestore + local storage.
 */
export async function saveFirebaseSettings(
  settings: AdminSettings
): Promise<AdminSettings> {
  const current = await getFirebaseSettings();
  const merged: AdminSettings = {
    ...current,
    ...settings,
    defaultAds: {
      ...DEFAULT_ADSTERRA_CONFIG,
      ...current.defaultAds,
      ...(settings.defaultAds || {}),
      status: {
        ...DEFAULT_ADSTERRA_CONFIG.status,
        ...(current.defaultAds?.status || {}),
        ...(settings.defaultAds?.status || {}),
      },
    },
  };

  // 1. Direct write to Cloud Firestore
  try {
    if (db) {
      const docRef = doc(db, "settings", "general");
      await setDoc(docRef, merged, { merge: true });
    }
  } catch (err) {
    console.error("Firestore saveFirebaseSettings error:", err);
  }

  // 2. Save locally
  writeLocalSettings(merged);

  return merged;
}

/**
 * High-level server-side loader for `/p/[slug]` SSR and `generateMetadata`.
 * Reads page and site settings directly, seamlessly applying active Adsterra units.
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

    // Auto-resolve any ImgBB viewer link or embed snippet dynamically
    let resolvedMediaUrl = page.mediaUrl || "";
    try {
      const { resolveIbbUrl, cleanMediaInputUrl } = await import("./mediaResolver");
      resolvedMediaUrl = await resolveIbbUrl(cleanMediaInputUrl(resolvedMediaUrl));
    } catch { }

    const defaultAds: AdsterraConfig = settings.defaultAds || DEFAULT_ADSTERRA_CONFIG;

    // Helper to get effective ad slot (custom or inherited default)
    const getEffectiveSlot = (slotKey: keyof AdsterraConfig): string => {
      const pageVal = (page.ads as any)?.[slotKey];
      if (typeof pageVal === "string" && pageVal.trim()) {
        return pageVal.trim();
      }
      if (page.useDefaultAds !== false) {
        const defVal = (defaultAds as any)?.[slotKey];
        if (typeof defVal === "string" && defVal.trim()) {
          return defVal.trim();
        }
      }
      return "";
    };

    const mergedAds: AdsterraConfig = {
      allAdsEnabled:
        page.ads?.allAdsEnabled !== undefined
          ? page.ads.allAdsEnabled
          : defaultAds.allAdsEnabled !== undefined
          ? defaultAds.allAdsEnabled
          : true,
      socialBar: getEffectiveSlot("socialBar"),
      popunder: getEffectiveSlot("popunder"),
      smartlink: getEffectiveSlot("smartlink"),
      banner300x250: getEffectiveSlot("banner300x250"),
      banner728x90: getEffectiveSlot("banner728x90"),
      banner320x50: getEffectiveSlot("banner320x50"),
      banner468x60: getEffectiveSlot("banner468x60"),
      banner160x600: getEffectiveSlot("banner160x600"),
      banner160x300: getEffectiveSlot("banner160x300"),
      nativeBanner: getEffectiveSlot("nativeBanner"),
      customAd: getEffectiveSlot("customAd"),
      status: {
        ...(defaultAds.status || {}),
        ...(page.ads?.status || {}),
      },
    };

    const fallbackAdCode = page.adCode || settings.defaultAdCode || "";

    const effectiveCtaLink =
      page.ctaLink && page.ctaLink !== "https://t.me" && page.ctaLink.trim()
        ? page.ctaLink.trim()
        : mergedAds.smartlink || "https://t.me";

    return {
      ...page,
      mediaUrl: resolvedMediaUrl,
      adCode: fallbackAdCode,
      ads: mergedAds,
      ctaLink: effectiveCtaLink,
    };
  } catch (error) {
    console.error(`Error in getPageForServer for slug ${slug}:`, error);
    return null;
  }
}

// REST helper functions kept for backwards compatibility with upload/route.ts
export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === "object") {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== "object") return null;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in val) {
    const res: Record<string, any> = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) res[k] = fromFirestoreValue(v);
    return res;
  }
  return null;
}
