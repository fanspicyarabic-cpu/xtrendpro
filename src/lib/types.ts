export type MediaType = 'image' | 'video';

export interface AdsterraStatusMap {
  socialBar?: boolean;
  popunder?: boolean;
  smartlink?: boolean;
  banner300x250?: boolean;
  banner728x90?: boolean;
  banner320x50?: boolean;
  banner468x60?: boolean;
  banner160x600?: boolean;
  banner160x300?: boolean;
  nativeBanner?: boolean;
  customAd?: boolean;
  [key: string]: boolean | undefined;
}

export interface AdsterraConfig {
  allAdsEnabled?: boolean; // Master switch to enable/disable all ads
  socialBar?: string;      // Social Bar (30673789)
  popunder?: string;       // Popunder (30673794)
  smartlink?: string;      // Smartlink Direct Link (30673795)
  banner300x250?: string;  // Banner 300x250 (30673796)
  banner728x90?: string;   // Banner 728x90 (30673801)
  banner320x50?: string;   // Banner 320x50 Mobile (30673800)
  banner468x60?: string;   // Banner 468x60 (30673797)
  banner160x600?: string;  // Banner 160x600 (30673799)
  banner160x300?: string;  // Banner 160x300 (30673798)
  nativeBanner?: string;   // Additional Native Banner slot
  customAd?: string;       // Custom Ad Code slot
  status?: AdsterraStatusMap; // Individual toggle status (true by default)
}

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

export interface LandingPageData {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  mediaUrl: string;
  mediaType: MediaType;
  adCode?: string;          // Legacy or custom code
  ads?: AdsterraConfig;     // Structured Adsterra Units
  useDefaultAds?: boolean;  // Whether to inherit default ads from settings
  ctaText?: string;
  ctaLink?: string;
  tags?: string[];
  views?: number;
  clicks?: number;
  createdAt: string | number | Date;
  updatedAt?: string | number | Date;
}

export interface AdminSettings {
  telegramBotToken?: string;
  telegramChannelId?: string;
  twitterClientId?: string;
  twitterClientSecret?: string;
  twitterApiKey?: string;
  twitterApiKeySecret?: string;
  twitterAccessToken?: string;
  twitterAccessTokenSecret?: string;
  adminPassword?: string;
  siteBaseUrl?: string;
  defaultAdCode?: string;
  defaultAds?: AdsterraConfig; // Structured Default Adsterra Units for all pages
}

export interface XAuthUser {
  id: string;
  username: string;
  name: string;
  profileImageUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Checks whether a specific Adsterra ad slot is currently active and not toggled off
 */
export function isAdActive(ads?: AdsterraConfig, key?: keyof AdsterraConfig | string): boolean {
  if (!ads) return false;
  // If master switch disabled all ads:
  if (ads.allAdsEnabled === false) return false;
  if (!key) return false;

  const raw = (ads as any)[key];
  if (!raw || typeof raw !== "string" || !raw.trim()) return false;

  // Check individual toggle in status map:
  if (ads.status && ads.status[key] === false) {
    return false;
  }
  return true;
}
