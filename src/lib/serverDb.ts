import fs from "fs";
import path from "path";
import { LandingPageData, AdminSettings } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PAGES_FILE = path.join(DATA_DIR, "pages.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

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

export function getStoredPages(): LandingPageData[] {
  ensureDataDir();
  if (!fs.existsSync(PAGES_FILE)) {
    fs.writeFileSync(PAGES_FILE, JSON.stringify(DEFAULT_PAGES, null, 2), "utf-8");
    return DEFAULT_PAGES;
  }
  try {
    const raw = fs.readFileSync(PAGES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading pages.json", e);
    return DEFAULT_PAGES;
  }
}

export function saveStoredPage(page: LandingPageData): LandingPageData {
  ensureDataDir();
  const pages = getStoredPages();
  const existingIndex = pages.findIndex((p) => p.slug === page.slug);
  
  const updatedPage = {
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

  fs.writeFileSync(PAGES_FILE, JSON.stringify(pages, null, 2), "utf-8");
  return updatedPage;
}

export function deleteStoredPage(slug: string): boolean {
  ensureDataDir();
  const pages = getStoredPages();
  const filtered = pages.filter((p) => p.slug !== slug);
  fs.writeFileSync(PAGES_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return true;
}

export function getStoredPageBySlug(slug: string): LandingPageData | null {
  const pages = getStoredPages();
  return pages.find((p) => p.slug === slug) || null;
}

export function getStoredSettings(): AdminSettings {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    return {
      telegramBotToken: "",
      telegramChannelId: "",
      siteBaseUrl: "http://localhost:3000",
      defaultAdCode: "",
    };
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export function saveStoredSettings(settings: AdminSettings): AdminSettings {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  return settings;
}
