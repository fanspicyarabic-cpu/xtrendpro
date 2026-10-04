"use client";

import React, { useState, useEffect, useRef } from "react";
import { LandingPageData, AdminSettings, MediaType, XAuthUser, AdsterraConfig } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/mediaResolver";
import AdsterraContainer from "@/components/AdsterraContainer";
import {
  Send,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  PlusCircle,
  Settings as SettingsIcon,
  Video,
  Image as ImageIcon,
  Flame,
  Radio,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Upload,
  HardDrive,
  FileVideo,
  FileImage,
  FolderOpen,
  Smartphone,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  Database,
  Link as LinkIcon,
  DollarSign,
  Maximize2
} from "lucide-react";

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: "video" | "image" | "other";
  createdAt: string;
}

export default function AdminDashboardArabic() {
  const [activeTab, setActiveTab] = useState<"create" | "media" | "pages" | "settings">("create");
  const [pages, setPages] = useState<LandingPageData[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings state with structured Adsterra ad codes
  const [settings, setSettings] = useState<AdminSettings>({
    telegramBotToken: "",
    telegramChannelId: "",
    twitterClientId: "",
    twitterClientSecret: "",
    twitterApiKey: "",
    twitterApiKeySecret: "",
    twitterAccessToken: "",
    twitterAccessTokenSecret: "",
    siteBaseUrl: "http://localhost:3000",
    defaultAdCode: "",
    defaultAds: {
      socialBar: "",
      popunder: "",
      smartlink: "",
      banner300x250: "",
      banner728x90: "",
      banner320x50: "",
      banner468x60: "",
      banner160x600: "",
      banner160x300: "",
    },
  });

  // Twitter OAuth state
  const [xUser, setXUser] = useState<XAuthUser | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<LandingPageData>>({
    slug: "",
    title: "",
    description: "",
    mediaUrl: "",
    mediaType: "image",
    adCode: "",
    useDefaultAds: true,
    ads: {
      socialBar: "",
      popunder: "",
      smartlink: "",
      banner300x250: "",
      banner728x90: "",
      banner320x50: "",
      banner468x60: "",
      banner160x600: "",
      banner160x300: "",
    },
    ctaText: "⚡ فتح ومشاهدة الفيديو بالكامل بجودة 4K الآن",
    ctaLink: "",
  });

  const [showCustomAds, setShowCustomAds] = useState(false);

  // Toast notifications
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
    checkTwitterOAuth();
  }, []);

  const showNotification = (type: "success" | "error" | "info", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pages from serverDb API
      const resPages = await fetch("/api/pages");
      const pagesData = await resPages.json();
      if (pagesData.success && pagesData.pages) {
        setPages(pagesData.pages);
      }

      // 2. Fetch uploaded files
      const resUploads = await fetch("/api/upload");
      const uploadsData = await resUploads.json();
      if (uploadsData.success && uploadsData.files) {
        setUploadedFiles(uploadsData.files);
      }

      // 3. Load settings from API
      const resSettings = await fetch("/api/settings");
      const settingsData = await resSettings.json();
      if (settingsData.success && settingsData.settings) {
        setSettings((prev) => ({
          ...prev,
          ...settingsData.settings,
          defaultAds: {
            ...prev.defaultAds,
            ...(settingsData.settings.defaultAds || {}),
          },
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkTwitterOAuth = () => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("twitter_connected");
    const username = urlParams.get("username");

    if (connected && username) {
      setXUser({ id: "x-user", username, name: username });
      showNotification("success", `تم الربط بنجاح مع حساب X (@${username})!`);
    } else {
      const match = document.cookie.match(/x_user_info=([^;]+)/);
      if (match) {
        try {
          const parsed = JSON.parse(decodeURIComponent(match[1]));
          setXUser(parsed);
        } catch {}
      }
    }
  };

  // Slug generator from title
  const handleAutoSlug = (text: string) => {
    const slug = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u0621-\u064A-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .slice(0, 50);
    setFormData((prev) => ({
      ...prev,
      slug: slug || `post-${Date.now().toString().slice(-6)}`,
    }));
  };

  // Handle File Upload from computer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(`جاري رفع ${file.name}...`);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل في رفع الملف");
      }

      showNotification("success", `تم رفع الملف (${data.file.name}) بنجاح وتخزينه!`);

      // Refresh uploads list
      setUploadedFiles((prev) => [data.file, ...prev]);

      // Automatically assign to current form if empty
      setFormData((prev) => ({
        ...prev,
        mediaUrl: data.file.url,
        mediaType: data.file.type === "video" ? "video" : "image",
      }));
    } catch (err: any) {
      showNotification("error", err.message || "حدث خطأ أثناء الرفع");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete uploaded file
  const handleDeleteUploadedFile = async (fileName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الملف "${fileName}" من السيرفر؟`)) return;
    try {
      const res = await fetch(`/api/upload?name=${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
      showNotification("success", "تم حذف الملف من التخزين بنجاح");
    } catch (e: any) {
      showNotification("error", e.message);
    }
  };

  // Handle Create or Update Landing Page
  const handleSubmitPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug || !formData.title || !formData.mediaUrl) {
      showNotification("error", "يرجى تعبئة الرابط المخصص، العنوان، ورابط الوسائط");
      return;
    }

    setIsSubmitting(true);
    try {
      // Inherit default ads if useDefaultAds is checked
      const finalAds: AdsterraConfig = formData.useDefaultAds
        ? {
            ...settings.defaultAds,
            ...(formData.ads || {}),
          }
        : (formData.ads || {});

      const newPage: LandingPageData = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        description: formData.description || "",
        mediaUrl: resolveMediaUrl(formData.mediaUrl.trim()),
        mediaType: (formData.mediaType as MediaType) || "image",
        adCode: formData.adCode || settings.defaultAdCode || "",
        ads: finalAds,
        useDefaultAds: formData.useDefaultAds,
        ctaText: formData.ctaText || "⚡ فتح ومشاهدة الفيديو بالكامل بجودة 4K الآن",
        ctaLink: formData.ctaLink || settings.defaultAds?.smartlink || "https://t.me",
        createdAt: new Date().toISOString(),
      };

      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPage),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل في حفظ ونشر الصفحة");
      }

      showNotification("success", `تم نشر صفحة الهبوط /p/${newPage.slug} بنجاح!`);

      // Reset form
      setFormData({
        slug: "",
        title: "",
        description: "",
        mediaUrl: "",
        mediaType: "image",
        adCode: "",
        useDefaultAds: true,
        ads: { ...settings.defaultAds },
        ctaText: "⚡ فتح ومشاهدة الفيديو بالكامل بجودة 4K الآن",
        ctaLink: settings.defaultAds?.smartlink || "https://t.me",
      });

      // Reload pages
      const resPages = await fetch("/api/pages");
      const pagesData = await resPages.json();
      if (pagesData.success) {
        setPages(pagesData.pages);
      }

      setActiveTab("pages");
    } catch (err: any) {
      showNotification("error", err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete page
  const handleDeletePage = async (slug: string) => {
    if (!confirm(`هل أنت متأكد من حذف صفحة الهبوط /p/${slug} نهائياً؟`)) return;
    try {
      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setPages((prev) => prev.filter((p) => p.slug !== slug));
      showNotification("success", `تم حذف الصفحة /p/${slug} بنجاح`);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Copy Link
  const handleCopyLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : settings.siteBaseUrl;
    const url = `${origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
    showNotification("info", "تم نسخ رابط الصفحة إلى الحافظة!");
  };

  // Broadcast to Telegram
  const handleBroadcastTelegram = async (page: LandingPageData) => {
    setIsBroadcasting(`tg-${page.slug}`);
    try {
      const res = await fetch("/api/telegram/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page,
          botToken: settings.telegramBotToken,
          channelId: settings.telegramChannelId,
          siteUrl: typeof window !== "undefined" ? window.location.origin : settings.siteBaseUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل البث إلى قناة تيليجرام");
      }
      showNotification("success", `تم البث بنجاح إلى قناة تليجرام (${settings.telegramChannelId || "المحددة"})!`);
    } catch (err: any) {
      showNotification("error", `خطأ تليجرام: ${err.message}`);
    } finally {
      setIsBroadcasting(null);
    }
  };

  // Broadcast to Twitter / X
  const handleBroadcastX = async (page: LandingPageData) => {
    setIsBroadcasting(`x-${page.slug}`);
    try {
      const res = await fetch("/api/x/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page,
          apiKey: settings.twitterApiKey,
          apiSecret: settings.twitterApiKeySecret,
          accessToken: settings.twitterAccessToken,
          accessSecret: settings.twitterAccessTokenSecret,
          siteUrl: typeof window !== "undefined" ? window.location.origin : settings.siteBaseUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.shareIntentUrl) {
          window.open(data.shareIntentUrl, "_blank");
          showNotification("info", "تم فتح محرر التغريدات على منصة X مع بطاقة الرابط!");
          return;
        }
        throw new Error(data.error || "فشل النشر على منصة X");
      }
      showNotification("success", `تم نشر التغريدة على حساب X بنجاح!`);
    } catch (err: any) {
      showNotification("error", `خطأ منصة X: ${err.message}`);
    } finally {
      setIsBroadcasting(null);
    }
  };

  // Save Settings to Backend API
  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      showNotification("success", "تم حفظ إعدادات وأكواد إعلانات Adsterra بنجاح وتفعيلها في جميع الصفحات!");
    } catch (e: any) {
      showNotification("error", `خطأ في حفظ الإعدادات: ${e.message}`);
    }
  };

  const totalViews = pages.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalStorageMB = (
    uploadedFiles.reduce((acc, curr) => acc + curr.size, 0) /
    (1024 * 1024)
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-[#070b13] text-white flex flex-col selection:bg-brand-500 selection:text-white" dir="rtl">
      {/* Top Professional Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-sky-500 to-accent-500 flex items-center justify-center font-black text-xl shadow-lg shadow-sky-500/25">
            X
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg tracking-wide text-white">
                منصة XTREN الحصرية
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                لوحة الإدارة
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              إدارة صفحات الهبوط · تخزين الميديا · Adsterra · تيليجرام و X
            </p>
          </div>
        </div>

        {/* Quick Top Actions & Twitter Auth Status */}
        <div className="flex items-center gap-3">
          {xUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-gray-200">@{xUser.username}</span>
            </div>
          ) : (
            <a
              href="/api/x/auth"
              className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 border border-white/15 text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-all"
            >
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>ربط حساب X (تويتر)</span>
            </a>
          )}

          <a
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <span>الموقع الرئيسي</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Toast Alert */}
      {statusMsg && (
        <div className="fixed top-16 left-6 z-50 max-w-md animate-in slide-in-from-top-3">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm font-semibold ${
              statusMsg.type === "success"
                ? "bg-emerald-950/95 text-emerald-200 border-emerald-500/50"
                : statusMsg.type === "error"
                ? "bg-rose-950/95 text-rose-200 border-rose-500/50"
                : "bg-sky-950/95 text-sky-200 border-sky-500/50"
            }`}
          >
            {statusMsg.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {statusMsg.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {statusMsg.type === "info" && <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col space-y-6">
        
        {/* Analytics & Stats Quick Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel-luxury p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">الصفحات المنشورة</p>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">{pages.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel-luxury p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">إجمالي المشاهدات</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                {totalViews.toLocaleString("ar-EG")}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel-luxury p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">الملفات المخزنة</p>
              <h3 className="text-xl sm:text-2xl font-black text-purple-400 mt-1">
                {uploadedFiles.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel-luxury p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">مساحة التخزين</p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                {totalStorageMB} MB
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "create"
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء صفحة هبوط جديدة</span>
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "media"
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>مدير الملفات والميديا ({uploadedFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("pages")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "pages"
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>إدارة الصفحات المنشورة ({pages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "settings"
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>أكواد Adsterra الافتراضية والإعدادات</span>
          </button>
        </div>

        {/* TAB 1: CREATE NEW LANDING PAGE + LIVE MOBILE SIMULATOR */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-panel-luxury rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-accent-500" />
                      إنشاء صفحة هبوط ديناميكية
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      يتم حفظ الصفحة في السيرفر وتوليد بطاقة OG تلقائياً للنشر على تليجرام و X
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                    /p/[slug]
                  </span>
                </div>

                <form onSubmit={handleSubmitPage} className="space-y-4 text-sm">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      عنوان العرض / اسم الموديل <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 🔥 العرض الحصري الكامل بدقة 4K فائقة الوضوح"
                      className="w-full glass-input-ar px-4 py-2.5 rounded-xl text-sm"
                      value={formData.title || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (!formData.slug) handleAutoSlug(e.target.value);
                      }}
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-300">
                        الرابط المخصص (Slug) <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAutoSlug(formData.title || "")}
                        className="text-[11px] text-sky-400 hover:underline font-semibold"
                      >
                        توليد تلقائي من العنوان
                      </button>
                    </div>
                    <div className="flex items-center rounded-xl overflow-hidden glass-input-ar" dir="ltr">
                      <span className="px-3 text-xs text-gray-500 bg-white/5 border-r border-white/10 py-2.5">
                        /p/
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="vip-premiere-01"
                        className="w-full bg-transparent px-3 py-2.5 text-sm focus:outline-none text-white font-mono text-left"
                        value={formData.slug || ""}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Media Upload & URL */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-300">
                        رابط ملف الوسائط (فيديو أو صورة) <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTab("media")}
                        className="text-[11px] text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>اختيار من الملفات المرفوعة</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="رابط مباشر للوسائط أو ملف مرفوع..."
                          className="w-full glass-input-ar px-3.5 py-2.5 rounded-xl text-xs font-mono"
                          value={formData.mediaUrl || ""}
                          onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                        />
                      </div>
                      <div>
                        <select
                          className="w-full glass-input-ar px-3 py-2.5 rounded-xl text-xs bg-slate-900 font-bold"
                          value={formData.mediaType || "image"}
                          onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as MediaType })}
                        >
                          <option value="image">صورة (Image)</option>
                          <option value="video">فيديو (MP4 Video)</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick upload trigger right inside form */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,video/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-sky-400" />
                        <span>{isUploading ? uploadProgress : "رفع ملف فيديو أو صورة من جهازك"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      الوصف / نص التشويق (يظهر في بطاقة تليجرام و X)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="شاهد المقطع الحصري الكامل قبل الحذف بدقة 4K فائقة الوضوح..."
                      className="w-full glass-input-ar px-4 py-2.5 rounded-xl text-xs"
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* CTA Text & Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">نص زر الإجراء (CTA)</label>
                      <input
                        type="text"
                        placeholder="⚡ فتح ومشاهدة الفيديو بجودة 4K"
                        className="w-full glass-input-ar px-3.5 py-2.5 rounded-xl text-xs font-bold"
                        value={formData.ctaText || ""}
                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">
                        رابط التحويل (أو اتركه فارغاً لاستخدام Smartlink)
                      </label>
                      <input
                        type="text"
                        placeholder={settings.defaultAds?.smartlink ? "مفعل تلقائياً: كود Smartlink من الإعدادات" : "https://t.me/your_channel"}
                        className="w-full glass-input-ar px-3.5 py-2.5 rounded-xl text-xs font-mono"
                        value={formData.ctaLink || ""}
                        onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Adsterra Integration Selector */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-gray-200">
                          نظام إعلانات Adsterra
                        </span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-emerald-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.useDefaultAds}
                          onChange={(e) => setFormData({ ...formData, useDefaultAds: e.target.checked })}
                          className="w-4 h-4 accent-emerald-500 rounded"
                        />
                        <span>استخدام أكواد Adsterra الافتراضية للموقع</span>
                      </label>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      عند تفعيل الخيار أعلاه، ستطبق جميع الأكواد التي قمت بضبطها في تبويب <strong>&quot;أكواد Adsterra الافتراضية&quot;</strong> (Social Bar، Popunder، Smartlink، Banners) تلقائياً على هذه الصفحة دون الحاجة لإعادة لصقها.
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowCustomAds(!showCustomAds)}
                      className="text-xs text-sky-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>{showCustomAds ? "إخفاء التخصيص اليدوي" : "+ تخصيص أكواد إعلانية خاصة بهذه الصفحة فقط"}</span>
                    </button>

                    {showCustomAds && (
                      <div className="pt-2 space-y-3 border-t border-white/10">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-300 mb-1">
                            كود بانر مخصص (300x250)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="كود مخصص للبانر..."
                            className="w-full glass-input-ar px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-300"
                            value={formData.ads?.banner300x250 || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ads: { ...(formData.ads || {}), banner300x250: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-cyan-glow w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl disabled:opacity-60 transition-all mt-4"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    <span>حفظ ونشر صفحة الهبوط وتفعيل الرابط المخصص</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Interactive Smartphone Live Simulator */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-3">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>محاكي الهاتف المباشر (Live Mobile Preview)</span>
              </div>

              {/* Smartphone Frame */}
              <div className="w-[310px] sm:w-[330px] rounded-[42px] border-[6px] border-slate-700 bg-[#070a12] shadow-2xl overflow-hidden p-3 relative flex flex-col">
                {/* Notch */}
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

                {/* Inner Screen */}
                <div className="rounded-[28px] overflow-hidden bg-[#070a12] border border-white/10 flex-1 flex flex-col justify-between text-center p-3 text-white relative">
                  
                  {/* Header in simulator */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                    <span className="text-[10px] font-black text-brand-400">XTREN VIP</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                      بث حصري
                    </span>
                  </div>

                  {/* Simulated Title */}
                  <div className="space-y-1 mb-2">
                    <h4 className="text-xs font-black line-clamp-2 leading-tight">
                      {formData.title || "عنوان العرض الأول يظهر هنا بشكل فوري"}
                    </h4>
                    <p className="text-[10px] text-gray-400 line-clamp-1">
                      {formData.description || "الوصف التشويقي يظهر هنا..."}
                    </p>
                  </div>

                  {/* Media Screen */}
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/80 border border-white/10 mb-3 relative flex items-center justify-center">
                    {formData.mediaUrl ? (
                      formData.mediaType === "video" ? (
                        <video src={resolveMediaUrl(formData.mediaUrl)} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={resolveMediaUrl(formData.mediaUrl)} alt="Preview" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="text-gray-500 text-[10px] flex flex-col items-center gap-1">
                        <ImageIcon className="w-5 h-5 text-gray-600" />
                        <span>معاينة الوسائط ستظهر هنا</span>
                      </div>
                    )}
                  </div>

                  {/* Simulated CTA Button */}
                  <div className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-accent-500 to-rose-600 text-white font-bold text-xs shadow-md mb-2">
                    {formData.ctaText || "⚡ مشاهدة الفيديو كاملاً بجودة 4K"}
                  </div>

                  {/* Simulated Ad Container */}
                  <div className="w-full rounded-lg bg-emerald-950/40 border border-emerald-500/30 py-2 text-[9px] text-emerald-300 font-bold">
                    إعلانات Adsterra (مفعلة تلقائياً)
                  </div>

                  {/* Footer in simulator */}
                  <div className="text-[8px] text-gray-600 pt-2 border-t border-white/5 mt-2">
                    © XTREN Media · رابط مشفر 100%
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MEDIA & FILE STORAGE MANAGER */}
        {activeTab === "media" && (
          <div className="space-y-6">
            <div className="glass-panel-luxury rounded-3xl p-6 border border-white/10 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-sky-400" />
                    مدير الملفات والوسائط المرفوعة
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    قم برفع مقاطع الفيديو (MP4) أو الصور ليتم تخزينها واستخدامها برابط دائم ومباشر في صفحات الهبوط
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="btn-cyan-glow px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? uploadProgress : "رفع ملف وسائط جديد"}</span>
                  </button>
                </div>
              </div>
            </div>

            {uploadedFiles.length === 0 ? (
              <div className="glass-panel-luxury rounded-3xl p-12 text-center space-y-3 border border-white/10">
                <FolderOpen className="w-12 h-12 text-gray-600 mx-auto" />
                <h3 className="text-base font-bold text-gray-300">لا توجد ملفات مرفوعة بعد</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  اضغط على زر &quot;رفع ملف وسائط جديد&quot; أعلاه لرفع أول فيديو أو صورة وتخزينها في السيرفر
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.name}
                    className="glass-panel-luxury rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group"
                  >
                    <div className="w-full aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                      {file.type === "video" ? (
                        <video src={file.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      )}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-gray-200 uppercase">
                        {file.type}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-white line-clamp-1" title={file.name}>
                          {file.name}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                          <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                          <span>{new Date(file.createdAt).toLocaleDateString("ar-EG")}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              mediaUrl: file.url,
                              mediaType: file.type === "video" ? "video" : "image",
                            }));
                            setActiveTab("create");
                            showNotification("success", `تم اختيار الملف (${file.name}) في النموذج!`);
                          }}
                          className="btn-cyan-glow flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold text-center"
                        >
                          استخدم في الصفحة
                        </button>

                        <button
                          onClick={() => {
                            const fullUrl = `${window.location.origin}${file.url}`;
                            navigator.clipboard.writeText(fullUrl);
                            showNotification("info", "تم نسخ رابط الملف المباشر!");
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                          title="نسخ الرابط"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteUploadedFile(file.name)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="حذف الملف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PUBLISHED PAGES MANAGER */}
        {activeTab === "pages" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                الصفحات المنشورة في قاعدة البيانات ({pages.length})
              </h2>
              <button
                onClick={loadAllData}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5" /> تحديث القائمة
              </button>
            </div>

            {pages.length === 0 ? (
              <div className="glass-panel-luxury rounded-3xl p-12 text-center space-y-3 border border-white/10">
                <p className="text-gray-400 text-sm">لا توجد أي صفحات منشورة بعد.</p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="btn-cyan-glow px-4 py-2 rounded-xl text-xs font-bold"
                >
                  إنشاء أول صفحة هبوط الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pages.map((p) => {
                  const isTg = isBroadcasting === `tg-${p.slug}`;
                  const isX = isBroadcasting === `x-${p.slug}`;

                  return (
                    <div
                      key={p.slug}
                      className="glass-panel-luxury rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all shadow-xl"
                    >
                      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                        <div className="w-full sm:w-44 h-28 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/10">
                          {p.mediaType === "video" ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <video src={p.mediaUrl} className="w-full h-full object-cover" />
                              <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Video className="w-6 h-6 text-white/80" />
                              </span>
                            </div>
                          ) : (
                            <img src={p.mediaUrl} alt={p.title} className="w-full h-full object-cover" />
                          )}
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-gray-200 uppercase">
                            {p.mediaType}
                          </span>
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                              /p/{p.slug}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              إعلانات Adsterra مفعلة
                            </span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1 mr-auto">
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                              {p.views ? p.views.toLocaleString("ar-EG") : "0"} مشاهدة
                            </span>
                          </div>

                          <h3 className="font-black text-base text-white">{p.title}</h3>
                          <p className="text-xs text-gray-400 line-clamp-1">{p.description || "لا يوجد وصف"}</p>

                          <div className="flex items-center gap-2 pt-2">
                            <a
                              href={`/p/${p.slug}`}
                              target="_blank"
                              className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                              <span>معاينة الرابط المباشر</span>
                            </a>

                            <button
                              onClick={() => handleCopyLink(p.slug)}
                              className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
                            >
                              {copiedSlug === p.slug ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>تم النسخ!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                                  <span>نسخ الرابط</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDeletePage(p.slug)}
                              className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 mr-auto"
                              title="حذف الصفحة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => handleBroadcastTelegram(p)}
                          disabled={isTg}
                          className="btn-tg-ar px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60 flex-1 sm:flex-none justify-center"
                        >
                          {isTg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>بث إلى قناة تيليجرام</span>
                        </button>

                        <button
                          onClick={() => handleBroadcastX(p)}
                          disabled={isX}
                          className="px-4 py-2 rounded-xl bg-black/80 hover:bg-black border border-white/20 text-xs font-bold text-white flex items-center gap-2 disabled:opacity-60 flex-1 sm:flex-none justify-center"
                        >
                          {isX ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5 text-sky-400" />}
                          <span>نشر على منصة X (تويتر)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ADSTERRA CODES MANAGER & PLATFORMS SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            
            {/* Adsterra Default Codes Section (Matching the User's Screenshot Exactly!) */}
            <div className="glass-panel-luxury rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    مدير أكواد إعلانات Adsterra الافتراضية لجميع الصفحات
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    ضع أكواد وحداتك الإعلانية من لوحة تحكم Adsterra هنا؛ وسيتم تطبيقها وتشغيلها تلقائياً على <strong>كل صفحات الهبوط</strong>.
                  </p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="btn-emerald-glow px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shrink-0"
                >
                  حفظ وتفعيل الأكواد لجميع الصفحات
                </button>
              </div>

              {/* Grid of the 9 Adsterra Ad Formats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
                
                {/* 1. Social Bar (30673789) */}
                <div className="glass-card-subtle p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      1. كود Social Bar (SocialBar_1)
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">ID: 30673789</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="الصق سكريبت الـ Social Bar هنا..."
                    className="w-full glass-input-ar p-3 rounded-xl text-xs font-mono text-emerald-300"
                    value={settings.defaultAds?.socialBar || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAds: { ...(settings.defaultAds || {}), socialBar: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400">يظهر كإشعار عائم تفاعلي عالي الـ CTR على الهاتف والحاسوب.</p>
                </div>

                {/* 2. Popunder (30673794) */}
                <div className="glass-card-subtle p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      2. كود Popunder (Popunder_1)
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">ID: 30673794</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="الصق سكريبت الـ Popunder هنا..."
                    className="w-full glass-input-ar p-3 rounded-xl text-xs font-mono text-emerald-300"
                    value={settings.defaultAds?.popunder || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAds: { ...(settings.defaultAds || {}), popunder: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400">يفتح نافذة إعلانية منبثقة عند أول لمسة للزائر لأعلى CPM.</p>
                </div>

                {/* 3. Smartlink (30673795) */}
                <div className="glass-card-subtle p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      3. رابط Smartlink المباشر (Smartlink_1)
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">ID: 30673795</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://beta.smartlink... أو رابط الربح المباشر"
                    className="w-full glass-input-ar p-3 rounded-xl text-xs font-mono text-emerald-300"
                    value={settings.defaultAds?.smartlink || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAds: { ...(settings.defaultAds || {}), smartlink: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-300 font-medium">يتم ربطه تلقائياً بزر المشاهدة والتحويل في كل الصفحات!</p>
                </div>

                {/* 4. Banner 300x250 (30673796) */}
                <div className="glass-card-subtle p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      4. بانر 300x250 (300x250_1)
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">ID: 30673796</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="كود Banner 300x250 (أسفل الفيديو مباشرة)..."
                    className="w-full glass-input-ar p-3 rounded-xl text-xs font-mono text-emerald-300"
                    value={settings.defaultAds?.banner300x250 || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAds: { ...(settings.defaultAds || {}), banner300x250: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400">يظهر تحت مشغل الفيديو مباشرة (أكثر مكان يجلب نقرات).</p>
                </div>

                {/* 5. Banner 728x90 (30673801) */}
                <div className="glass-card-subtle p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      5. بانر 728x90 (728x90_1)
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">ID: 30673801</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="كود Banner 728x90 (لشاشات الكمبيوتر)..."
                    className="w-full glass-input-ar p-3 rounded-xl text-xs font-mono text-emerald-300"
                    value={settings.defaultAds?.banner728x90 || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAds: { ...(settings.defaultAds || {}), banner728x90: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400">يظهر أعلى الصفحة للزوار المتصفحين من الكمبيوتر واللابتوب.</p>
                </div>

                {/* 6. Banner 320x50 Mobile (30673800) */}
                <div className="glass-card-subtle p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      6. بانر موبايل 320x50 (320x50_1)
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">ID: 30673800</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="كود Banner 320x50 (للهواتف الذكية)..."
                    className="w-full glass-input-ar p-3 rounded-xl text-xs font-mono text-emerald-300"
                    value={settings.defaultAds?.banner320x50 || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAds: { ...(settings.defaultAds || {}), banner320x50: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400">بانر علوي متجاوب ومخصص تماماً لشاشات الهواتف الذكية.</p>
                </div>

                {/* 7. Banner 468x60 (30673797) */}
                <div className="glass-card-subtle p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      7. بانر 468x60 (468x60_1)
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">ID: 30673797</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="كود Banner 468x60..."
                    className="w-full glass-input-ar p-3 rounded-xl text-xs font-mono text-emerald-300"
                    value={settings.defaultAds?.banner468x60 || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAds: { ...(settings.defaultAds || {}), banner468x60: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400">يظهر أسفل الصفحة للأجهزة اللوحية والموبايل العريض.</p>
                </div>

                {/* 8. Banner 160x600 (30673799) */}
                <div className="glass-card-subtle p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      8. بانر جانبي 160x600 (160x600_1)
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">ID: 30673799</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="كود Skyscraper Banner 160x600..."
                    className="w-full glass-input-ar p-3 rounded-xl text-xs font-mono text-emerald-300"
                    value={settings.defaultAds?.banner160x600 || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAds: { ...(settings.defaultAds || {}), banner160x600: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400">بانر جانبي طولي يثبت على جانب الشاشة في أجهزة الكمبيوتر.</p>
                </div>

                {/* 9. Banner 160x300 (30673798) */}
                <div className="glass-card-subtle p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400" />
                      9. بانر جانبي 160x300 (160x300_1)
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">ID: 30673798</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="كود Banner 160x300..."
                    className="w-full glass-input-ar p-3 rounded-xl text-xs font-mono text-emerald-300"
                    value={settings.defaultAds?.banner160x300 || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAds: { ...(settings.defaultAds || {}), banner160x300: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400">بانر جانبي بديل متوسط الحجم للشاشات الجانبية.</p>
                </div>

              </div>
            </div>

            {/* Telegram & Twitter / X Integration Section */}
            <div className="glass-panel-luxury rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-sky-400" />
                  إعدادات قنوات البث (تيليجرام ومنصة X)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {/* Telegram */}
                <div className="glass-card-subtle p-5 rounded-2xl space-y-3.5 border border-white/5">
                  <h3 className="font-bold text-sky-300 flex items-center gap-2 text-sm">
                    <Send className="w-4 h-4 text-sky-400" /> إعدادات قناة تيليجرام
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Telegram Bot Token</label>
                    <input
                      type="password"
                      placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                      className="w-full glass-input-ar px-3.5 py-2 rounded-xl text-xs font-mono"
                      value={settings.telegramBotToken || ""}
                      onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">معرف القناة (Channel ID)</label>
                    <input
                      type="text"
                      placeholder="@my_channel_username أو -1001234567890"
                      className="w-full glass-input-ar px-3.5 py-2 rounded-xl text-xs font-mono"
                      value={settings.telegramChannelId || ""}
                      onChange={(e) => setSettings({ ...settings, telegramChannelId: e.target.value })}
                    />
                  </div>
                </div>

                {/* Twitter / X */}
                <div className="glass-card-subtle p-5 rounded-2xl space-y-3.5 border border-white/5">
                  <h3 className="font-bold text-gray-200 flex items-center gap-2 text-sm">
                    <Radio className="w-4 h-4 text-white" /> مفاتيح منصة X (Twitter)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">API Key</label>
                      <input
                        type="password"
                        placeholder="API Key"
                        className="w-full glass-input-ar px-3 py-2 rounded-xl text-xs font-mono"
                        value={settings.twitterApiKey || ""}
                        onChange={(e) => setSettings({ ...settings, twitterApiKey: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">API Secret</label>
                      <input
                        type="password"
                        placeholder="API Secret"
                        className="w-full glass-input-ar px-3 py-2 rounded-xl text-xs font-mono"
                        value={settings.twitterApiKeySecret || ""}
                        onChange={(e) => setSettings({ ...settings, twitterApiKeySecret: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Access Token</label>
                      <input
                        type="password"
                        placeholder="Access Token"
                        className="w-full glass-input-ar px-3 py-2 rounded-xl text-xs font-mono"
                        value={settings.twitterAccessToken || ""}
                        onChange={(e) => setSettings({ ...settings, twitterAccessToken: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Token Secret</label>
                      <input
                        type="password"
                        placeholder="Token Secret"
                        className="w-full glass-input-ar px-3 py-2 rounded-xl text-xs font-mono"
                        value={settings.twitterAccessTokenSecret || ""}
                        onChange={(e) => setSettings({ ...settings, twitterAccessTokenSecret: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Base URL */}
                <div className="md:col-span-2 glass-card-subtle p-5 rounded-2xl space-y-3.5 border border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      رابط الموقع الأساسي (Base URL)
                    </label>
                    <input
                      type="text"
                      placeholder="https://your-domain.vercel.app"
                      className="w-full glass-input-ar px-3.5 py-2.5 rounded-xl text-xs font-mono"
                      value={settings.siteBaseUrl || ""}
                      onChange={(e) => setSettings({ ...settings, siteBaseUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveSettings}
                  className="btn-cyan-glow px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg"
                >
                  حفظ جميع الإعدادات
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
