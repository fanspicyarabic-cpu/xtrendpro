import React from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { getPageForServer, getFirebaseSettings } from "@/lib/firebaseAdmin";
import { resolveMediaInfo } from "@/lib/mediaResolver";
import { isAdActive } from "@/lib/types";
import AdsterraContainer from "@/components/AdsterraContainer";
import SmartMediaPlayer from "@/components/SmartMediaPlayer";
import { 
  Eye, 
  Flame, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle,
  Clock,
  Sparkles,
  Lock
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: {
    slug: string;
  };
}

// 1. Dynamic Open Graph & Twitter Cards generator in Arabic
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const rawSlug = params.slug || "";
  const cleanSlug = rawSlug.trim().replace(/^\/+|\/+$/g, "");
  
  const [page, settings] = await Promise.all([
    getPageForServer(cleanSlug).then(p => p || getPageForServer(rawSlug)),
    getFirebaseSettings().catch(() => null),
  ]);

  if (!page) {
    return {
      title: "المحتوى غير متوفر · XTREN",
      description: "عذراً، المحتوى المطلوب غير متاح حالياً.",
    };
  }

  const title = page.title || "عرض حصري بجودة فائقة 4K";
  const description = page.description || "شاهد البث الكامل الحصري بجودة فائقة الوضوح. متاح لفترة محدودة الآن.";

  // Clean & resolve real media URL (convert ImgBB viewer links to direct raw image)
  let rawMediaUrl = page.mediaUrl || "";
  try {
    const { resolveIbbUrl, cleanMediaInputUrl } = await import("@/lib/mediaResolver");
    rawMediaUrl = await resolveIbbUrl(cleanMediaInputUrl(rawMediaUrl));
  } catch {}

  const mediaInfo = resolveMediaInfo(rawMediaUrl);
  const isVideo = page.mediaType === "video" && (mediaInfo.kind === "video" || mediaInfo.kind === "embed");

  const configuredBaseUrl =
    settings?.siteBaseUrl && !settings.siteBaseUrl.includes("localhost")
      ? settings.siteBaseUrl.trim()
      : undefined;

  const rawBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    configuredBaseUrl ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://xtrendpro1.vercel.app");

  const baseUrl = rawBaseUrl.startsWith("http")
    ? rawBaseUrl.replace(/\/+$/, "")
    : `https://${rawBaseUrl.replace(/\/+$/, "")}`;

  // Determine preview thumbnail: ALWAYS prioritize user's actual image or video poster
  let previewThumbnail = rawMediaUrl;
  if (isVideo) {
    previewThumbnail = mediaInfo.posterUrl || "";
  } else if (mediaInfo.url) {
    previewThumbnail = mediaInfo.url;
  }

  // If thumbnail is relative or missing or points directly to a raw video file, ensure a valid absolute image URL
  if (!previewThumbnail || previewThumbnail.match(/\.(mp4|mov|webm)(\?.*)?$/i)) {
    previewThumbnail = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80";
  } else if (previewThumbnail.startsWith("/")) {
    previewThumbnail = `${baseUrl}${previewThumbnail}`;
  }

  const pageFullUrl = `${baseUrl}/p/${cleanSlug}`;

  return {
    title: `${title} | منصة XTREN`,
    description: description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: pageFullUrl,
    },
    openGraph: {
      title: title,
      description: description,
      url: pageFullUrl,
      siteName: "XTREN Media",
      type: "website",
      locale: "ar_AR",
      images: [
        {
          url: previewThumbnail,
          secureUrl: previewThumbnail,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/jpeg",
        },
      ],
      videos: isVideo && mediaInfo.url
        ? [
            {
              url: mediaInfo.url,
              width: 1280,
              height: 720,
              type: "video/mp4",
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [previewThumbnail],
    },
  };
}

// 2. Dynamic Arabic Landing Page with Smart Player & Multi-Zone Adsterra Placements
export default async function DynamicLandingPageArabic({ params }: PageProps) {
  const rawSlug = params.slug || "";
  const cleanSlug = rawSlug.trim().replace(/^\/+|\/+$/g, "");
  const page = (await getPageForServer(cleanSlug)) || (await getPageForServer(rawSlug));

  if (!page) {
    return (
      <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#070a12] text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="glass-panel-luxury p-8 rounded-3xl max-w-md w-full border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Flame className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black">الصفحة غير متوفرة أو تم نقلها</h1>
          <p className="text-xs text-gray-400">
            لم نتمكن من العثور على الصفحة المطلوبة (<code className="text-brand-400 font-mono">/p/{cleanSlug || rawSlug}</code>). تأكد من كتابة الرابط بشكل صحيح.
          </p>
          <div className="pt-2">
            <Link
              href="/admin"
              className="btn-cyan-glow w-full py-2.5 px-4 rounded-xl text-xs font-bold inline-block"
            >
              الذهاب إلى لوحة التحكم
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const views = page.views ? page.views.toLocaleString("ar-EG") : "4,280";
  const ads = page.ads || {};

  // Check which ads are enabled
  const showSocialBar = isAdActive(ads, "socialBar");
  const showPopunder = isAdActive(ads, "popunder");
  const showBanner728 = isAdActive(ads, "banner728x90");
  const showBanner320 = isAdActive(ads, "banner320x50");
  const showBanner468 = isAdActive(ads, "banner468x60");
  const showBanner300 = isAdActive(ads, "banner300x250");
  const showBanner160_600 = isAdActive(ads, "banner160x600");
  const showBanner160_300 = isAdActive(ads, "banner160x300");
  const showNative = isAdActive(ads, "nativeBanner");
  const showCustomAd = isAdActive(ads, "customAd") || Boolean(page.adCode && isAdActive(ads, "customAd") !== false);

  // Target CTA Link: Custom link if specified by user, otherwise immediately falls back to active Smartlink
  const hasCustomLink = Boolean(page.ctaLink && page.ctaLink.trim() && page.ctaLink.trim() !== "#ad-placement");
  const isSmartlinkActive = isAdActive(ads, "smartlink");
  const targetCtaLink = hasCustomLink
    ? page.ctaLink!.trim()
    : (isSmartlinkActive && ads.smartlink ? ads.smartlink.trim() : "#ad-placement");

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#070a12] text-white flex flex-col items-center justify-between relative selection:bg-accent-500 selection:text-white" dir="rtl">
      
      {/* 1. Global Popunder Script Execution (If Active) */}
      {showPopunder && ads.popunder && (
        <AdsterraContainer adCode={ads.popunder} enabled={true} className="hidden" />
      )}

      {/* 2. Global Social Bar Script Execution (If Active) */}
      {showSocialBar && ads.socialBar && (
        <AdsterraContainer adCode={ads.socialBar} enabled={true} className="hidden" />
      )}

      {/* Dynamic Ambient Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-10 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-brand-500/10 blur-[100px] sm:blur-[140px] rounded-full" />
        <div className="absolute bottom-20 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-accent-500/15 blur-[100px] sm:blur-[140px] rounded-full" />
      </div>

      {/* Top Professional Header */}
      <header className="w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-black text-base sm:text-lg tracking-wide bg-gradient-to-l from-brand-400 via-sky-200 to-accent-500 bg-clip-text text-transparent truncate">
              XTREN · عرض حصري
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5 text-brand-400" />
              <span>{views} مشاهدة نشطة</span>
            </span>
          </div>
        </div>
      </header>

      {/* 3. DEDICATED TOP AD ZONE (Responsive Desktop 728x90 / Mobile 320x50 / Tablet 468x60) */}
      {(showBanner728 || showBanner320 || showBanner468) && (
        <section aria-label="Top Ad Placement" className="w-full max-w-4xl px-3 sm:px-4 pt-3 flex flex-col items-center justify-center overflow-hidden z-10">
          {showBanner728 && ads.banner728x90 && (
            <div className="hidden md:block w-full text-center">
              <AdsterraContainer
                adCode={ads.banner728x90}
                slotName="إعلان ممول (728x90)"
                enabled={true}
              />
            </div>
          )}
          {showBanner320 && ads.banner320x50 && (
            <div className="block md:hidden w-full text-center">
              <AdsterraContainer
                adCode={ads.banner320x50}
                slotName="إعلان ممول (320x50)"
                enabled={true}
              />
            </div>
          )}
          {!showBanner320 && showBanner468 && ads.banner468x60 && (
            <div className="block md:hidden w-full text-center">
              <AdsterraContainer
                adCode={ads.banner468x60}
                slotName="إعلان ممول (468x60)"
                enabled={true}
              />
            </div>
          )}
        </section>
      )}

      {/* Main Content Layout with Sidebars */}
      <div className="w-full max-w-6xl px-3 sm:px-4 py-4 flex-1 flex items-start justify-center gap-6 z-10 overflow-hidden">
        
        {/* DEDICATED RIGHT SIDEBAR AD (Desktop Skyscraper 160x600 or 160x300) */}
        {(showBanner160_600 || showBanner160_300) && (
          <aside aria-label="Sidebar Ad Right" className="hidden lg:flex flex-col items-center w-44 shrink-0 sticky top-20">
            <AdsterraContainer
              adCode={showBanner160_600 ? ads.banner160x600 : ads.banner160x300}
              slotName={showBanner160_600 ? "بانر جانبي (160x600)" : "بانر جانبي (160x300)"}
              enabled={true}
            />
          </aside>
        )}

        {/* Center Main Media Column */}
        <div className="w-full max-w-2xl flex flex-col items-center mx-auto">
          
          {/* Badges & Title */}
          <div className="w-full text-center space-y-2.5 mb-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                بث حصري 4K فائق الدقة
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug px-1">
              {page.title}
            </h1>

            {page.description && (
              <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto leading-relaxed px-2">
                {page.description}
              </p>
            )}
          </div>

          {/* ULTRA HIGH-PERFORMANCE SMART MEDIA PLAYER */}
          <div className="w-full mb-5">
            <SmartMediaPlayer
              mediaUrl={page.mediaUrl}
              mediaType={page.mediaType}
              title={page.title}
              ctaLink={targetCtaLink}
              ctaText={page.ctaText}
            />
          </div>

          {/* HIGH CONVERSION CALL TO ACTION (CTA) BUTTON */}
          <div className="w-full flex flex-col items-center gap-3 mb-5 px-1 sm:px-0">
            <a
              href={targetCtaLink}
              target="_blank"
              rel="noreferrer"
              className="btn-accent-glow w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl font-black text-center text-sm sm:text-lg flex items-center justify-center gap-2 shadow-xl transition-all duration-200 active:scale-95 animate-pulse"
            >
              <Flame className="w-5 h-5 text-yellow-300 shrink-0" />
              <span className="truncate">{page.ctaText || "⚡ فتح ومشاهدة الفيديو بالكامل بجودة 4K الآن"}</span>
              <ExternalLink className="w-4 h-4 mr-1 opacity-80 shrink-0" />
            </a>
            
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                رابط آمن ومشفر 100%
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                بث فوري بدون تحميل
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                وصول غير محدود
              </span>
            </div>
          </div>

          {/* 4. DEDICATED UNDER-VIDEO AD ZONE (Banner 300x250) - Highest CTR Spot */}
          {showBanner300 && ads.banner300x250 && (
            <div className="w-full glass-card-subtle rounded-2xl p-4 border border-emerald-500/20 bg-emerald-950/10 my-3 flex flex-col items-center overflow-hidden">
              <AdsterraContainer
                adCode={ads.banner300x250}
                slotName="مكان مخصص للإعلان (Banner 300x250)"
                enabled={true}
              />
            </div>
          )}

          {/* 5. DEDICATED NATIVE BANNER AD ZONE */}
          {showNative && ads.nativeBanner && (
            <div className="w-full glass-card-subtle rounded-2xl p-3 border border-white/10 my-2 flex flex-col items-center overflow-hidden">
              <AdsterraContainer
                adCode={ads.nativeBanner}
                slotName="إعلان مخصص Native Banner"
                enabled={true}
              />
            </div>
          )}

          {/* 6. DEDICATED CUSTOM / FALLBACK AD ZONE */}
          {showCustomAd && (ads.customAd || page.adCode) && !ads.banner300x250 && (
            <div id="ad-placement" className="w-full glass-card-subtle rounded-2xl p-4 border border-white/10 my-3 overflow-hidden flex flex-col items-center">
              <AdsterraContainer
                adCode={ads.customAd || page.adCode}
                slotName="محتوى إعلاني مخصص"
                enabled={true}
              />
            </div>
          )}

          {/* 7. DEDICATED BOTTOM AD ZONE (Banner 468x60) */}
          {showBanner468 && ads.banner468x60 && (
            <div className="w-full glass-card-subtle rounded-2xl p-3 border border-white/10 my-2 flex flex-col items-center overflow-hidden">
              <AdsterraContainer
                adCode={ads.banner468x60}
                slotName="بانر أسفل الصفحة (468x60)"
                enabled={true}
              />
            </div>
          )}

        </div>

        {/* DEDICATED LEFT SIDEBAR AD (Desktop Skyscraper 160x300 or 160x600) */}
        {(showBanner160_300 || showBanner160_600) && (
          <aside aria-label="Sidebar Ad Left" className="hidden lg:flex flex-col items-center w-44 shrink-0 sticky top-20">
            <AdsterraContainer
              adCode={showBanner160_300 && ads.banner160x300 ? ads.banner160x300 : ads.banner160x600}
              slotName={showBanner160_300 && ads.banner160x300 ? "بانر جانبي (160x300)" : "بانر جانبي (160x600)"}
              enabled={true}
            />
          </aside>
        )}

      </div>

      {/* Professional Footer */}
      <footer className="w-full border-t border-white/10 py-6 text-center text-xs text-gray-400 bg-slate-950/60 backdrop-blur-md z-10 mt-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} منصة XTREN الحصرية · جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <span className="hover:text-white transition-colors cursor-pointer">إشعار الأمان وحقوق الملكية</span>
            <span className="hover:text-white transition-colors cursor-pointer">+18 الامتثال العمري</span>
            <span className="hover:text-white transition-colors cursor-pointer">شروط الاستخدام</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
