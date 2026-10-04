import React from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { getPageForServer } from "@/lib/firebaseAdmin";
import { resolveMediaUrl } from "@/lib/mediaResolver";
import AdsterraContainer from "@/components/AdsterraContainer";
import { 
  Eye, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink, 
  CheckCircle,
  Clock
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
  const { slug } = params;
  const page = await getPageForServer(slug);

  if (!page) {
    return {
      title: "المحتوى غير متوفر · XTREN",
      description: "عذراً، المحتوى المطلوب غير متاح حالياً.",
    };
  }

  const title = page.title || "عرض حصري بجودة فائقة 4K";
  const description = page.description || "شاهد البث الكامل الحصري بجودة فائقة الوضوح. متاح لفترة محدودة الآن.";
  const mediaUrl = page.mediaUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200";
  const isVideo = page.mediaType === "video";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://xtren.vercel.app";

  return {
    title: `${title} | منصة XTREN الحصرية`,
    description: description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: title,
      description: description,
      url: `/p/${slug}`,
      siteName: "XTREN Media",
      type: "video.other",
      locale: "ar_AR",
      images: [
        {
          url: mediaUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      videos: isVideo
        ? [
            {
              url: mediaUrl,
              width: 1280,
              height: 720,
              type: "video/mp4",
            },
          ]
        : undefined,
    },
    twitter: {
      card: isVideo ? "player" : "summary_large_image",
      title: title,
      description: description,
      images: [mediaUrl],
      players: isVideo
        ? [
            {
              playerUrl: `/p/${slug}`,
              streamUrl: mediaUrl,
              width: 1280,
              height: 720,
            },
          ]
        : undefined,
    },
  };
}

// 2. Dynamic Arabic Landing Page with Multi-Zone Adsterra Placements
export default async function DynamicLandingPageArabic({ params }: PageProps) {
  const { slug } = params;
  const page = await getPageForServer(slug);

  if (!page) {
    return (
      <main className="min-h-screen bg-[#070a12] text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="glass-panel-luxury p-8 rounded-3xl max-w-md w-full border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Flame className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black">الصفحة غير متوفرة أو تم نقلها</h1>
          <p className="text-xs text-gray-400">
            لم نتمكن من العثور على الصفحة المطلوبة (<code className="text-brand-400 font-mono">/p/{slug}</code>). تأكد من كتابة الرابط بشكل صحيح.
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

  const isVideo = page.mediaType === "video";
  const views = page.views ? page.views.toLocaleString("ar-EG") : "3,840";
  const ads = page.ads || {};

  // Destination CTA Link (Smartlink priority if set)
  const targetCtaLink = ads.smartlink || page.ctaLink || "#ad-placement";

  return (
    <main className="min-h-screen bg-[#070a12] text-white flex flex-col items-center justify-between relative selection:bg-accent-500 selection:text-white" dir="rtl">
      {/* 1. Global Popunder Script Execution */}
      {ads.popunder && <AdsterraContainer adCode={ads.popunder} className="hidden" />}

      {/* 2. Global Social Bar Script Execution */}
      {ads.socialBar && <AdsterraContainer adCode={ads.socialBar} className="hidden" />}

      {/* Dynamic Ambient Background Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-accent-500/15 blur-[150px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-black text-lg tracking-wide bg-gradient-to-l from-brand-400 via-sky-200 to-accent-500 bg-clip-text text-transparent">
              XTREN · عرض حصري
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5 text-brand-400" />
              <span>{views} مشاهدة نشطة</span>
            </span>
          </div>
        </div>
      </header>

      {/* 3. Top Banner Slot (728x90 Desktop / 320x50 or 468x60 Mobile) */}
      <div className="w-full max-w-4xl px-4 pt-4 flex flex-col items-center justify-center">
        {ads.banner728x90 && (
          <div className="hidden md:block w-full text-center">
            <AdsterraContainer adCode={ads.banner728x90} />
          </div>
        )}
        {ads.banner320x50 && (
          <div className="block md:hidden w-full text-center">
            <AdsterraContainer adCode={ads.banner320x50} />
          </div>
        )}
        {!ads.banner320x50 && ads.banner468x60 && (
          <div className="block md:hidden w-full text-center">
            <AdsterraContainer adCode={ads.banner468x60} />
          </div>
        )}
      </div>

      {/* Main Content Container with Sidebars */}
      <div className="w-full max-w-6xl px-4 py-4 flex-1 flex items-start justify-center gap-6 z-10">
        
        {/* Right Desktop Sidebar Banner (160x600 or 160x300) */}
        {(ads.banner160x600 || ads.banner160x300) && (
          <aside className="hidden lg:flex flex-col items-center w-44 shrink-0 sticky top-20">
            <AdsterraContainer adCode={ads.banner160x600 || ads.banner160x300} />
          </aside>
        )}

        {/* Center Main Media Column */}
        <div className="w-full max-w-2xl flex flex-col items-center">
          
          {/* Badges & Title */}
          <div className="w-full text-center space-y-3 mb-5">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                بث حصري 4K فائق الدقة
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                محتوى معتمد بدون إعلانات مزعجة
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug">
              {page.title}
            </h1>

            {page.description && (
              <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
                {page.description}
              </p>
            )}
          </div>

          {/* Media Frame (High-Res Player or Image) */}
          <div className="w-full relative rounded-2xl overflow-hidden glass-panel-luxury border border-white/15 shadow-2xl group mb-5 aspect-video bg-black flex items-center justify-center">
            {isVideo ? (
              <video
                src={resolveMediaUrl(page.mediaUrl)}
                controls
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-black/60">
                <img
                  src={resolveMediaUrl(page.mediaUrl)}
                  alt={page.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-xs text-white/90 pointer-events-none">
                  <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    جودة أصلية Ultra HD 4K
                  </span>
                  <span className="bg-rose-600 font-extrabold px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
                    حصري للمشتركين
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. High Conversion CTA Button (Direct Link / Smartlink) */}
          <div className="w-full flex flex-col items-center gap-3 mb-5">
            <a
              href={targetCtaLink}
              target="_blank"
              rel="noreferrer"
              className="btn-accent-glow w-full py-4 px-6 rounded-2xl font-black text-center text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-xl transition-all duration-200 active:scale-95 animate-pulse"
            >
              <Flame className="w-5 h-5 text-yellow-300" />
              <span>{page.ctaText || "⚡ فتح ومشاهدة الفيديو بالكامل بجودة 4K الآن"}</span>
              <ExternalLink className="w-4 h-4 mr-1 opacity-80" />
            </a>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                رابط آمن ومشفر 100%
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                بث فوري بدون تحميل
              </span>
            </div>
          </div>

          {/* 5. Middle Banner Slot (Banner 300x250) */}
          {ads.banner300x250 && (
            <div className="w-full glass-card-subtle rounded-2xl p-4 border border-white/10 my-3 flex flex-col items-center">
              <div className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider">
                إعلان مدعوم (Banner 300x250)
              </div>
              <AdsterraContainer adCode={ads.banner300x250} />
            </div>
          )}

          {/* 6. Legacy / Custom Fallback Ad Code */}
          {page.adCode && !ads.banner300x250 && (
            <div id="ad-placement" className="w-full glass-card-subtle rounded-2xl p-4 border border-white/10 my-3">
              <AdsterraContainer adCode={page.adCode} />
            </div>
          )}

          {/* 7. Bottom Banner Slot (468x60 or 728x90) */}
          {ads.banner468x60 && (
            <div className="w-full glass-card-subtle rounded-2xl p-3 border border-white/10 my-2 flex flex-col items-center">
              <AdsterraContainer adCode={ads.banner468x60} />
            </div>
          )}

        </div>

        {/* Left Desktop Sidebar Banner (160x600 or 160x300) */}
        {(ads.banner160x600 || ads.banner160x300) && (
          <aside className="hidden lg:flex flex-col items-center w-44 shrink-0 sticky top-20">
            <AdsterraContainer adCode={ads.banner160x600 || ads.banner160x300} />
          </aside>
        )}

      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-6 text-center text-xs text-gray-400 bg-slate-950/60 backdrop-blur-md z-10">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} منصة XTREN · جميع الحقوق محفوظة.</p>
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
