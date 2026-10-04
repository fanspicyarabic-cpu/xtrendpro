export type MediaType = 'image' | 'video';

export interface AdsterraConfig {
  socialBar?: string;      // Social Bar (30673789)
  popunder?: string;       // Popunder (30673794)
  smartlink?: string;      // Smartlink Direct Link (30673795)
  banner300x250?: string;  // Banner 300x250 (30673796)
  banner728x90?: string;   // Banner 728x90 (30673801)
  banner320x50?: string;   // Banner 320x50 Mobile (30673800)
  banner468x60?: string;   // Banner 468x60 (30673797)
  banner160x600?: string;  // Banner 160x600 (30673799)
  banner160x300?: string;  // Banner 160x300 (30673798)
}

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
