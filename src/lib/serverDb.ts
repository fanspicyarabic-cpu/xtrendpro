import fs from "fs";
import path from "path";
import os from "os";
import { LandingPageData, AdminSettings } from "./types";

// Determine writable directory for Serverless (Vercel / Lambda) vs Local Dev
const IS_SERVERLESS = Boolean(
  process.env.VERCEL || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NODE_ENV === "production"
);

const SEED_DIR = path.join(process.cwd(), "data");
const DATA_DIR = IS_SERVERLESS ? path.join(os.tmpdir(), "xtren-data") : SEED_DIR;
const PAGES_FILE = path.join(DATA_DIR, "pages.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

// In-Memory cache for super fast access and fail-safe guarantee in serverless
let inMemoryPages: LandingPageData[] | null = null;
let inMemorySettings: AdminSettings | null = null;

// Initial demo pages in Arabic
const DEFAULT_PAGES: LandingPageData[] = [
  {
    slug: "vip-premiere-arabic",
    title: "🔥 العرض الحصري الكامل بدقة 4K فائقة الوضوح",
    description: "شاهد المقطع الحصري الكامل قبل الحذف. جودة فائقة وبث مباشر بدون انقطاع.",
    mediaUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
    mediaType: "image",
    adCode: `<!-- Adsterra 300x250 Banner Demo -->
<script type="text/javascript">
	atOptions = {
		'key' : 'demo_adsterra_key_300x250',
		'format' : 'iframe',
		'height' : 250,
		'width' : 300,
		'params' : {}
	};
</script>
<script type="text/javascript" src="//www.topcreativeformat.com/demo_adsterra_key_300x250/invoke.js"></script>`,
    ctaText: "⚡ فتح الفيديو الكامل بجودة 4K الآن",
    ctaLink: "https://t.me",
    views: 3450,
    clicks: 820,
    createdAt: new Date().toISOString(),
  },
  {
    slug: "test-model-premiere-4k",
    title: "🎬 العرض الأول المثير - المشاهد غير المعروضة",
    description: "كواليس ومقاطع حصرية لم يسبق نشرها بجودة فائقة الوضوح.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    mediaType: "video",
    adCode: `<!-- Adsterra Social Bar Demo -->
<script type='text/javascript' src='//pl12345678.highperformancegate.com/ab/cd/ef/abcdef123456.js'></script>`,
    ctaText: "🔥 متابعة مشاهدة البث كاملاً على تليجرام",
    ctaLink: "https://t.me",
    views: 1890,
    clicks: 410,
    createdAt: new Date().toISOString(),
  }
];

// Ensure writable data directory exists and seed initial data if running in serverless /tmp
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (IS_SERVERLESS) {
      if (!fs.existsSync(PAGES_FILE)) {
        const seedPages = path.join(SEED_DIR, "pages.json");
        if (fs.existsSync(seedPages)) {
          try {
            fs.copyFileSync(seedPages, PAGES_FILE);
          } catch {}
        }
      }
      if (!fs.existsSync(SETTINGS_FILE)) {
        const seedSettings = path.join(SEED_DIR, "settings.json");
        if (fs.existsSync(seedSettings)) {
          try {
            fs.copyFileSync(seedSettings, SETTINGS_FILE);
          } catch {}
        }
      }
    }
  } catch (err) {
    // Fail-safe: memory cache will handle storage
  }
}

export function getStoredPages(): LandingPageData[] {
  if (inMemoryPages && inMemoryPages.length > 0) {
    return inMemoryPages;
  }

  ensureDataDir();

  // Try reading from writable location (/tmp or local data)
  if (fs.existsSync(PAGES_FILE)) {
    try {
      const raw = fs.readFileSync(PAGES_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryPages = parsed;
        return parsed;
      }
    } catch (e) {}
  }

  // Fallback to read from seed bundled files
  const seedPages = path.join(SEED_DIR, "pages.json");
  if (fs.existsSync(seedPages)) {
    try {
      const raw = fs.readFileSync(seedPages, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryPages = parsed;
        return parsed;
      }
    } catch (e) {}
  }

  inMemoryPages = DEFAULT_PAGES;
  return DEFAULT_PAGES;
}

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fanspicyrabic";
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAz1AHssprR5V0fKJEnhew0riAqGMAf0WU";

export function saveStoredPage(page: LandingPageData): LandingPageData {
  const pages = [...getStoredPages()];
  const existingIndex = pages.findIndex((p) => p.slug === page.slug);
  
  const updatedPage: LandingPageData = {
    ...page,
    views: page.views || (existingIndex >= 0 ? pages[existingIndex].views || 0 : Math.floor(Math.random() * 500) + 120),
    clicks: page.clicks || (existingIndex >= 0 ? pages[existingIndex].clicks || 0 : 0),
    createdAt: existingIndex >= 0 ? pages[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    pages[existingIndex] = updatedPage;
  } else {
    pages.unshift(updatedPage);
  }

  // Always update in-memory cache first
  inMemoryPages = pages;

  // 1. Try persisting to disk in writable directory safely
  try {
    ensureDataDir();
    fs.writeFileSync(PAGES_FILE, JSON.stringify(pages, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write pages to disk (relying on memory):", e);
  }

  // 2. Persist to Firestore REST API (Works permanently across all Vercel instances)
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/pages/${encodeURIComponent(page.slug)}?key=${FIREBASE_API_KEY}`;
    const payload = {
      fields: {
        slug: { stringValue: updatedPage.slug || "" },
        title: { stringValue: updatedPage.title || "" },
        description: { stringValue: updatedPage.description || "" },
        mediaUrl: { stringValue: updatedPage.mediaUrl || "" },
        mediaType: { stringValue: updatedPage.mediaType || "image" },
        adCode: { stringValue: updatedPage.adCode || "" },
        ctaText: { stringValue: updatedPage.ctaText || "" },
        ctaLink: { stringValue: updatedPage.ctaLink || "" },
        views: { integerValue: String(updatedPage.views || 0) },
        clicks: { integerValue: String(updatedPage.clicks || 0) },
        createdAt: { stringValue: updatedPage.createdAt || new Date().toISOString() },
        updatedAt: { stringValue: updatedPage.updatedAt || new Date().toISOString() },
        ads: {
          mapValue: {
            fields: {
              socialBar: { stringValue: updatedPage.ads?.socialBar || "" },
              popunder: { stringValue: updatedPage.ads?.popunder || "" },
              smartlink: { stringValue: updatedPage.ads?.smartlink || "" },
              banner300x250: { stringValue: updatedPage.ads?.banner300x250 || "" },
              banner728x90: { stringValue: updatedPage.ads?.banner728x90 || "" },
              banner320x50: { stringValue: updatedPage.ads?.banner320x50 || "" },
              banner468x60: { stringValue: updatedPage.ads?.banner468x60 || "" },
              banner160x600: { stringValue: updatedPage.ads?.banner160x600 || "" },
              banner160x300: { stringValue: updatedPage.ads?.banner160x300 || "" },
            }
          }
        }
      }
    };

    fetch(firestoreUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch((err) => console.warn("Firestore sync warning:", err));
  } catch (err) {
    console.warn("Firestore save error:", err);
  }

  return updatedPage;
}

export function deleteStoredPage(slug: string): boolean {
  const pages = getStoredPages().filter((p) => p.slug !== slug);
  inMemoryPages = pages;

  try {
    ensureDataDir();
    fs.writeFileSync(PAGES_FILE, JSON.stringify(pages, null, 2), "utf-8");
  } catch (e) {}

  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/pages/${encodeURIComponent(slug)}?key=${FIREBASE_API_KEY}`;
    fetch(firestoreUrl, { method: "DELETE" }).catch(() => {});
  } catch (e) {}

  return true;
}

export function getStoredPageBySlug(slug: string): LandingPageData | null {
  const pages = getStoredPages();
  return pages.find((p) => p.slug === slug) || null;
}

export function getStoredSettings(): AdminSettings {
  if (inMemorySettings && Object.keys(inMemorySettings).length > 0) {
    return inMemorySettings;
  }

  ensureDataDir();

  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      inMemorySettings = parsed;
      return parsed;
    } catch (e) {}
  }

  const seedSettings = path.join(SEED_DIR, "settings.json");
  if (fs.existsSync(seedSettings)) {
    try {
      const raw = fs.readFileSync(seedSettings, "utf-8");
      const parsed = JSON.parse(raw);
      inMemorySettings = parsed;
      return parsed;
    } catch (e) {}
  }

  const defaultSettings: AdminSettings = {
    telegramBotToken: "",
    telegramChannelId: "",
    siteBaseUrl: "https://xtren.vercel.app",
    defaultAdCode: "",
  };

  inMemorySettings = defaultSettings;
  return defaultSettings;
}

export function saveStoredSettings(settings: AdminSettings): AdminSettings {
  inMemorySettings = settings;

  try {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write settings to disk (relying on memory):", e);
  }

  return settings;
}
