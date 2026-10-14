"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LandingPageData, AdminSettings, MediaType, XAuthUser, AdsterraConfig, isAdActive } from "@/lib/types";
import { resolveMediaUrl, detectMediaType, resolveMediaInfo, cleanMediaInputUrl } from "@/lib/mediaResolver";
import SmartMediaPlayer from "@/components/SmartMediaPlayer";
import {
  Send,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  PlusCircle,
  Video,
  Image as ImageIcon,
  Flame,
  Radio,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Upload,
  HardDrive,
  FolderOpen,
  Smartphone,
  Layers,
  ShieldCheck,
  Link as LinkIcon,
  DollarSign,
  Edit3,
  Power,
  ToggleLeft,
  ToggleRight,
  Info,
  CheckCircle,
  X,
  Lock,
  Key,
  LogOut
} from "lucide-react";

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: "video" | "image" | "other";
  createdAt: string;
}

// Definition of all 11 Adsterra ad slots with metadata and placement descriptions
const ADSTERRA_SLOTS: Array<{
  key: keyof AdsterraConfig;
  id: string;
  name: string;
  placement: string;
  desc: string;
  type: "banner" | "direct" | "floating" | "custom";
  device: "all" | "mobile" | "desktop";
}> = [
    {
      key: "socialBar",
      id: "30673789",
      name: "Social Bar (SocialBar_1)",
      placement: "شريط إشعارات تفاعلي عائم",
      desc: "يظهر كإشعار تفاعلي أو أيقونة دردشة ذكية عائمة على الهاتف والكمبيوتر لجلب أعلى CTR دون حجب المحتوى.",
      type: "floating",
      device: "all",
    },
    {
      key: "popunder",
      id: "30673794",
      name: "Popunder (Popunder_1)",
      placement: "نافذة منبثقة خلفية عالية الـ CPM",
      desc: "يفتح نافذة إعلانية منبثقة تلقائياً عند أول نقرة أو لمسة للزائر على المشغل لأقصى عائد ربحي ممكن.",
      type: "floating",
      device: "all",
    },
    {
      key: "smartlink",
      id: "30673795",
      name: "Smartlink (Smartlink_1)",
      placement: "الرابط المباشر للربح (مرتبط بزر المشاهدة)",
      desc: "يتم ربطه فورياً بزر التحويل والمشاهدة الرئيسي في كل الصفحات لتحويل الزوار إلى أفضل العروض الربحية.",
      type: "direct",
      device: "all",
    },
    {
      key: "banner300x250",
      id: "30673796",
      name: "Banner 300x250 (300x250_1)",
      placement: "أسفل مشغل الفيديو مباشرة (أعلى نقرات)",
      desc: "المكان الذهبي للإعلانات! يظهر تحت المشغل وزر المشاهدة مباشرة، المكان الأكثر جذباً لانتباه المشاهد.",
      type: "banner",
      device: "all",
    },
    {
      key: "banner728x90",
      id: "30673801",
      name: "Leaderboard Banner 728x90 (728x90_1)",
      placement: "أعلى الصفحة لشاشات الكمبيوتر واللابتوب",
      desc: "بانر عريض يظهر في رأس الصفحة للزوار المتصفحين من الكمبيوتر وشاشات العرض الكبيرة.",
      type: "banner",
      device: "desktop",
    },
    {
      key: "banner320x50",
      id: "30673800",
      name: "Mobile Banner 320x50 (320x50_1)",
      placement: "أعلى الصفحة مخصص للهواتف الذكية",
      desc: "بانر متجاوب ومخصص بالكامل لشاشات الموبايل يظهر أعلى المحتوى لضمان ظهور الإعلان بدون أي تشويه.",
      type: "banner",
      device: "mobile",
    },
    {
      key: "banner468x60",
      id: "30673797",
      name: "Banner 468x60 (468x60_1)",
      placement: "أسفل الصفحة للأجهزة اللوحية والموبايل",
      desc: "بانر متوسط متجاوب يوضع في الجزء السفلي قبل التذييل لتحقيق أرباح إضافية عند التمرير.",
      type: "banner",
      device: "all",
    },
    {
      key: "banner160x600",
      id: "30673799",
      name: "Skyscraper Banner 160x600 (160x600_1)",
      placement: "بانر جانبي طولي ثابت (يمين أو يسار)",
      desc: "بانر عمودي ثابت في السايدبار لشاشات الكمبيوتر، يظل ظاهراً طوال فترة بقاء المشاهد في الصفحة.",
      type: "banner",
      device: "desktop",
    },
    {
      key: "banner160x300",
      id: "30673798",
      name: "Banner 160x300 (160x300_1)",
      placement: "بانر جانبي بديل متوسط",
      desc: "بانر سايدبار متوسط الحجم للأجهزة ذات الدقة المتوسطة.",
      type: "banner",
      device: "desktop",
    },
    {
      key: "nativeBanner",
      id: "Native_1",
      name: "Native Banner (إعلانات المحتوى الموصى به)",
      placement: "بين المحتوى وزر الإجراء",
      desc: "إعلانات أصلية مدمجة تحاكي مقاطع الفيديو المقترحة للحصول على نقرات حقيقية عالية جداً.",
      type: "banner",
      device: "all",
    },
    {
      key: "customAd",
      id: "Custom_1",
      name: "كود إعلاني مخصص إضافي",
      placement: "منطقة مخصصة حرة",
      desc: "يمكنك وضع أي كود إعلاني إضافي من Adsterra أو أي شبكة إعلانية أخرى ترغب بها.",
      type: "custom",
      device: "all",
    },
  ];

export default function AdminDashboardArabic() {
  const [activeTab, setActiveTab] = useState<"create" | "media" | "pages" | "settings">("create");
  const [pages, setPages] = useState<LandingPageData[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Edit Page state
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time link auto-detection state
  const [detectedMediaPlatform, setDetectedMediaPlatform] = useState<string | null>(null);

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

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthPassword, setShowAuthPassword] = useState(false);

  // Password change state in settings
  const [currentPassInput, setCurrentPassInput] = useState("");
  const [newPassInput, setNewPassInput] = useState("");
  const [confirmPassInput, setConfirmPassInput] = useState("");
  const [passChangeLoading, setPassChangeLoading] = useState(false);
  const [passChangeMsg, setPassChangeMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        loadAllData();
        checkTwitterOAuth();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    } catch {
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password: authPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setAuthPassword("");
        loadAllData();
        checkTwitterOAuth();
        showNotification("success", "تم تسجيل الدخول بنجاح! أهلاً بك في لوحة الإدارة");
      } else {
        setAuthError(data.error || "كلمة المرور غير صحيحة، يرجى المحاولة مجدداً.");
      }
    } catch {
      setAuthError("فشل الاتصال بالخادم، يرجى المحاولة لاحقاً.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {}
    setIsAuthenticated(false);
    showNotification("info", "تم تسجيل الخروج وقفل لوحة التحكم بنجاح.");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassInput || newPassInput.length < 4) {
      setPassChangeMsg({ type: "error", text: "كلمة المرور الجديدة يجب أن تكون 4 أحرف أو أرقام على الأقل" });
      return;
    }
    if (newPassInput !== confirmPassInput) {
      setPassChangeMsg({ type: "error", text: "تأكيد كلمة المرور غير متطابق" });
      return;
    }
    setPassChangeLoading(true);
    setPassChangeMsg(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          oldPassword: currentPassInput,
          newPassword: newPassInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPassChangeMsg({ type: "success", text: "تم تحديث كلمة المرور بنجاح!" });
        setCurrentPassInput("");
        setNewPassInput("");
        setConfirmPassInput("");
        showNotification("success", "تم تحديث كلمة مرور لوحة التحكم بنجاح");
      } else {
        setPassChangeMsg({ type: "error", text: data.error || "فشل تحديث كلمة المرور" });
      }
    } catch {
      setPassChangeMsg({ type: "error", text: "حدث خطأ في الاتصال بالخادم" });
    } finally {
      setPassChangeLoading(false);
    }
  };

  const showNotification = (type: "success" | "error" | "info", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pages with cache busting
      const resPages = await fetch(`/api/pages?t=${Date.now()}`, { cache: "no-store" });
      const pagesData = await resPages.json();
      if (pagesData.success && Array.isArray(pagesData.pages)) {
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
            allAdsEnabled: settingsData.settings.defaultAds?.allAdsEnabled !== false,
            ...prev.defaultAds,
            ...(settingsData.settings.defaultAds || {}),
            status: {
              ...(prev.defaultAds?.status || {}),
              ...(settingsData.settings.defaultAds?.status || {}),
            },
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
        } catch { }
      }
    }
  };

  // Real-time intelligent media link handler with ImgBB auto-conversion
  const handleMediaUrlInput = (rawUrl: string) => {
    const cleaned = cleanMediaInputUrl(rawUrl);
    if (!cleaned) {
      setDetectedMediaPlatform(null);
      setFormData((prev) => ({ ...prev, mediaUrl: "" }));
      return;
    }

    const detected = detectMediaType(cleaned);
    const info = resolveMediaInfo(cleaned);
    setDetectedMediaPlatform(info.platform);

    setFormData((prev) => ({
      ...prev,
      mediaUrl: cleaned,
      mediaType: detected,
    }));

    // If it's an ImgBB viewer link (ibb.co/...) convert immediately to direct CDN URL
    if (cleaned.includes("ibb.co/") && !cleaned.includes("i.ibb.co/")) {
      setDetectedMediaPlatform("جاري فك رابط ImgBB...");
      fetch(`/api/resolve-media?url=${encodeURIComponent(cleaned)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.resolvedUrl) {
            setFormData((prev) => ({
              ...prev,
              mediaUrl: data.resolvedUrl,
              mediaType: "image",
            }));
            setDetectedMediaPlatform("ImgBB (صورة مباشرة)");
            showNotification("success", "تم التعرف على رابط ImgBB وتحويله إلى رابط مباشر بنجاح!");
          }
        })
        .catch(() => {});
    }
  };

  // Auto slug generator from title
  const handleAutoSlug = (text: string) => {
    const slug = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u0621-\u064A-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .slice(0, 50);
    setFormData((prev) => ({
      ...prev,
      slug: slug || `premiere-${Date.now().toString().slice(-6)}`,
    }));
  };

  // Helper to upload with XHR and progress tracking
  const uploadWithXHR = (
    url: string,
    formData: FormData,
    onProgress: (percent: number) => void
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress(percent);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`فشل الرفع (كود ${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("حدث خطأ في الاتصال أثناء الرفع"));
      xhr.send(formData);
    });
  };

  // Handle File Upload from computer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(`جاري تجهيز ${file.name}...`);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isVideo = ["mp4", "webm", "mov", "m4v"].includes(ext) || file.type.startsWith("video/");
      const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext) || file.type.startsWith("image/");

      let uploadedFileRecord: UploadedFile | null = null;

      // Method 1: If it's a video, attempt direct browser upload to Videy CDN (bypasses serverless payload limit, handles large videos)
      if (isVideo) {
        try {
          setUploadProgress("جاري رفع الفيديو إلى خادم البث المباشر (0%)...");
          const videyFd = new FormData();
          videyFd.append("file", file);
          const videyRes = await uploadWithXHR(
            "https://videy.co/api/upload",
            videyFd,
            (pct) => setUploadProgress(`جاري رفع الفيديو... ${pct}%`)
          );

          if (videyRes && videyRes.id) {
            const detectedExt = ext === "mov" ? "mov" : "mp4";
            const streamUrl = `https://cdn.videy.co/${videyRes.id}.${detectedExt}`;
            uploadedFileRecord = {
              name: `${Date.now()}_${file.name}`,
              url: streamUrl,
              size: file.size,
              type: "video",
              createdAt: new Date().toISOString(),
            };

            // Register in Firestore for gallery persistence
            fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "register", file: uploadedFileRecord }),
            }).catch(() => {});
          }
        } catch (videyErr) {
          console.warn("Direct Videy upload failed, falling back to server route:", videyErr);
        }
      } else if (isImage) {
        // Method 2: If it's an image, attempt direct cloud image upload
        try {
          setUploadProgress("جاري رفع الصورة (0%)...");
          const imgFd = new FormData();
          imgFd.append("reqtype", "fileupload");
          imgFd.append("time", "72h");
          imgFd.append("fileToUpload", file);
          const rawUrl = await uploadWithXHR(
            "https://litterbox.catbox.moe/resources/internals/api.php",
            imgFd,
            (pct) => setUploadProgress(`جاري رفع الصورة... ${pct}%`)
          );
          if (typeof rawUrl === "string" && rawUrl.trim().startsWith("http")) {
            uploadedFileRecord = {
              name: `${Date.now()}_${file.name}`,
              url: rawUrl.trim(),
              size: file.size,
              type: "image",
              createdAt: new Date().toISOString(),
            };

            // Register in Firestore
            fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "register", file: uploadedFileRecord }),
            }).catch(() => {});
          }
        } catch (imgErr) {
          console.warn("Direct image upload failed, falling back to server route:", imgErr);
        }
      }

      // Method 3: Fallback through /api/upload
      if (!uploadedFileRecord) {
        setUploadProgress(`جاري رفع ${file.name} عبر السيرفر...`);
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
        uploadedFileRecord = data.file;
      }

      if (uploadedFileRecord) {
        showNotification("success", `تم رفع الملف (${file.name}) بنجاح وتجهيزه!`);
        // Refresh uploads list
        setUploadedFiles((prev) => [uploadedFileRecord!, ...prev]);
        // Automatically assign to current form
        handleMediaUrlInput(uploadedFileRecord.url);
      }
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

  // Edit existing page: load into form
  const handleEditPage = (page: LandingPageData) => {
    setEditingSlug(page.slug);
    setFormData({
      slug: page.slug,
      title: page.title,
      description: page.description || "",
      mediaUrl: page.mediaUrl,
      mediaType: page.mediaType,
      ctaText: page.ctaText || "⚡ فتح ومشاهدة الفيديو بالكامل بجودة 4K الآن",
      ctaLink: page.ctaLink || "",
      useDefaultAds: page.useDefaultAds !== false,
      ads: page.ads || { ...settings.defaultAds },
      adCode: page.adCode || "",
    });
    handleMediaUrlInput(page.mediaUrl);
    setActiveTab("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
    showNotification("info", `تم تحميل صفحة "${page.title}" في محرر التعديل`);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingSlug(null);
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
      ctaLink: "",
    });
    setDetectedMediaPlatform(null);
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
      // Prepare ads properly without wiping default ads with blank strings
      let finalAds: AdsterraConfig;
      if (formData.useDefaultAds) {
        finalAds = { ...(settings.defaultAds || {}) };
        if (formData.ads) {
          finalAds.allAdsEnabled =
            formData.ads.allAdsEnabled !== undefined
              ? formData.ads.allAdsEnabled
              : settings.defaultAds?.allAdsEnabled ?? true;
          finalAds.status = {
            ...(settings.defaultAds?.status || {}),
            ...(formData.ads.status || {}),
          };
          (Object.keys(formData.ads) as (keyof AdsterraConfig)[]).forEach((key) => {
            if (key !== "status" && key !== "allAdsEnabled") {
              const val = formData.ads?.[key];
              if (typeof val === "string" && val.trim()) {
                (finalAds as any)[key] = val.trim();
              }
            }
          });
        }
      } else {
        finalAds = formData.ads || {};
      }

      const newPage: LandingPageData = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        description: formData.description || "",
        mediaUrl: formData.mediaUrl.trim(),
        mediaType: (formData.mediaType as MediaType) || "image",
        adCode: formData.adCode || settings.defaultAdCode || "",
        ads: finalAds,
        useDefaultAds: formData.useDefaultAds,
        ctaText: formData.ctaText || "⚡ فتح ومشاهدة الفيديو بالكامل بجودة 4K الآن",
        ctaLink: formData.ctaLink ? formData.ctaLink.trim() : "",
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

      showNotification(
        "success",
        editingSlug
          ? `تم تحديث صفحة الهبوط /p/${newPage.slug} بنجاح!`
          : `تم نشر صفحة الهبوط /p/${newPage.slug} بنجاح!`
      );

      // Reset form
      handleCancelEdit();

      // Reload pages with cache busting
      try {
        const resPages = await fetch(`/api/pages?t=${Date.now()}`, { cache: "no-store" });
        const pagesData = await resPages.json();
        if (pagesData.success && Array.isArray(pagesData.pages)) {
          setPages(pagesData.pages);
        } else if (data.page) {
          setPages((prev) => [data.page, ...prev.filter((p) => p.slug !== data.page.slug)]);
        }
      } catch {
        if (data.page) {
          setPages((prev) => [data.page, ...prev.filter((p) => p.slug !== data.page.slug)]);
        }
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

  // Toggle master ad switch
  const handleToggleMasterAds = () => {
    const current = settings.defaultAds?.allAdsEnabled !== false;
    setSettings((prev) => ({
      ...prev,
      defaultAds: {
        ...prev.defaultAds,
        allAdsEnabled: !current,
      },
    }));
    showNotification("info", !current ? "تم تفعيل كافة إعلانات الموقع 🟢" : "تم إيقاف كافة إعلانات الموقع مؤقتاً 🔴");
  };

  // Toggle individual Adsterra ad status
  const handleToggleAdSlot = (slotKey: keyof AdsterraConfig) => {
    const currentStatus = settings.defaultAds?.status?.[slotKey];
    // Default is active (true) unless explicitly set to false
    const isCurrentlyActive = currentStatus !== false;
    const newStatus = !isCurrentlyActive;

    setSettings((prev) => ({
      ...prev,
      defaultAds: {
        ...prev.defaultAds,
        status: {
          ...(prev.defaultAds?.status || {}),
          [slotKey]: newStatus,
        },
      },
    }));

    showNotification(
      "info",
      newStatus
        ? `تم تفعيل إعلان (${slotKey}) 🟢`
        : `تم إيقاف إعلان (${slotKey}) مؤقتاً 🔴`
    );
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

  // Stats for ads
  const masterAdsOn = settings.defaultAds?.allAdsEnabled !== false;
  const configuredAdsCount = ADSTERRA_SLOTS.filter(
    (s) => Boolean((settings.defaultAds as any)?.[s.key]?.trim())
  ).length;
  const activeAdsCount = masterAdsOn
    ? ADSTERRA_SLOTS.filter(
      (s) =>
        Boolean((settings.defaultAds as any)?.[s.key]?.trim()) &&
        settings.defaultAds?.status?.[s.key] !== false
    ).length
    : 0;

  // If verifying authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center text-white" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-sky-500 to-accent-500 flex items-center justify-center font-black text-2xl shadow-xl shadow-brand-500/30 animate-pulse mb-4">
          X
        </div>
        <p className="text-sm font-bold text-gray-300 animate-pulse">جاري التحقق من أمان وصلاحية لوحة التحكم...</p>
      </div>
    );
  }

  // If not authenticated, show Separate Luxury Admin Login Portal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b13] text-white flex flex-col justify-between relative overflow-hidden" dir="rtl">
        {/* Glowing ambiences */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-brand-500/15 blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-accent-500/10 blur-[150px] pointer-events-none rounded-full" />

        {/* Top Minimal Header */}
        <header className="w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 via-sky-500 to-accent-500 flex items-center justify-center font-black text-xl shadow-lg shadow-sky-500/25">
              X
            </div>
            <span className="font-black text-base bg-gradient-to-l from-brand-400 via-white to-accent-500 bg-clip-text text-transparent">
              منصة XTREN الحصرية
            </span>
          </div>
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex items-center gap-1.5"
          >
            <span>الموقع الرئيسي</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </header>

        {/* Center Login Box */}
        <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
          <div className="max-w-md w-full glass-panel-luxury p-8 sm:p-10 rounded-3xl border border-white/15 shadow-2xl relative space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20">
                <Lock className="w-8 h-8 text-sky-400" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-sky-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>منطقة إدارة محمية ومشفرة</span>
              </div>
              <h1 className="text-2xl font-black text-white">لوحة تحكم منصة XTREN</h1>
              <p className="text-xs text-gray-400 leading-relaxed">
                يرجى إدخال كلمة المرور لتسجيل الدخول والوصول إلى لوحة إدارة الصفحات والإعلانات
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">كلمة المرور للدخول</label>
                <div className="relative">
                  <input
                    type={showAuthPassword ? "text" : "password"}
                    required
                    autoFocus
                    placeholder="أدخل كلمة المرور..."
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full glass-input-ar px-4 py-3 rounded-2xl text-sm text-left pr-10 pl-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn-cyan-glow w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-brand-500/30 transition-all disabled:opacity-50"
              >
                {authLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>تسجيل الدخول إلى اللوحة</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 text-center border-t border-white/5">
              <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>منطقة إدارة محمية ومشفرة بالكامل</span>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-white/10 py-4 text-center text-xs text-gray-500 bg-slate-950/70">
          <p>© {new Date().getFullYear()} منصة XTREN · بوابة الإدارة الآمنة</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-white flex flex-col selection:bg-brand-500 selection:text-white" dir="rtl">

      {/* Top Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-sky-500 to-accent-500 flex items-center justify-center font-black text-xl shadow-lg shadow-sky-500/25">
            X
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg tracking-wide text-white">
                منصة XTREN الاحترافية
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                لوحة الإدارة الشاملة
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              إدارة صفحات الهبوط · مشغل الوسائط الذكي · إدارة إعلانات Adsterra · تيليجرام ومنصة X
            </p>
          </div>
        </div>

        {/* Quick Top Actions & Twitter Auth Status & Logout */}
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
              <span>ربط حساب X</span>
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

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-white px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 transition-all border border-rose-500/30 font-bold"
            title="قفل لوحة التحكم والخروج"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Toast Alert */}
      {statusMsg && (
        <div className="fixed top-16 left-6 z-50 max-w-md animate-in slide-in-from-top-3">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm font-semibold ${statusMsg.type === "success"
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
              <p className="text-xs text-gray-400 font-medium">الإعلانات النشطة</p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                {activeAdsCount} <span className="text-xs font-normal text-gray-400">/ {configuredAdsCount}</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel-luxury p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">الملفات المخزنة</p>
              <h3 className="text-xl sm:text-2xl font-black text-purple-400 mt-1">
                {uploadedFiles.length} <span className="text-xs font-normal text-gray-400">({totalStorageMB} MB)</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${activeTab === "create"
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{editingSlug ? "تعديل الصفحة الحالية" : "إنشاء صفحة هبوط جديدة"}</span>
          </button>

          <button
            onClick={() => setActiveTab("pages")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${activeTab === "pages"
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            <Layers className="w-4 h-4" />
            <span>إدارة الصفحات وتعديلها ({pages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${activeTab === "settings"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-300" />
            <span>إدارة وتعديل وإيقاف إعلانات Adsterra ({configuredAdsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${activeTab === "media"
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>مدير الملفات والميديا ({uploadedFiles.length})</span>
          </button>
        </div>

        {/* TAB 1: CREATE OR EDIT LANDING PAGE + LIVE MOBILE SIMULATOR */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Form Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-panel-luxury rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">

                {/* Header of Form */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      {editingSlug ? (
                        <>
                          <Edit3 className="w-5 h-5 text-amber-400" />
                          <span>تعديل صفحة الهبوط: /p/{editingSlug}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-brand-400" />
                          <span>إنشاء صفحة هبوط ديناميكية احترافية</span>
                        </>
                      )}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      التعرف التلقائي على روابط الفيديو الترويجي والصور مع دعم كامل للتشغيل على الهاتف والكمبيوتر.
                    </p>
                  </div>

                  {editingSlug && (
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>إلغاء التعديل</span>
                    </button>
                  )}
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
                        if (!formData.slug && !editingSlug) handleAutoSlug(e.target.value);
                      }}
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-300">
                        الرابط المخصص (Slug) <span className="text-rose-400">*</span>
                      </label>
                      {!editingSlug && (
                        <button
                          type="button"
                          onClick={() => handleAutoSlug(formData.title || "")}
                          className="text-[11px] text-sky-400 hover:underline font-semibold"
                        >
                          توليد تلقائي من العنوان
                        </button>
                      )}
                    </div>
                    <div className="flex items-center rounded-xl overflow-hidden glass-input-ar" dir="ltr">
                      <span className="px-3 text-xs text-gray-500 bg-white/5 border-r border-white/10 py-2.5">
                        /p/
                      </span>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingSlug)}
                        placeholder="vip-premiere-01"
                        className="w-full bg-transparent px-3 py-2.5 text-sm focus:outline-none text-white font-mono text-left disabled:opacity-60"
                        value={formData.slug || ""}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Media Upload & URL with Intelligent Auto-Detection */}
                  <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-brand-400" />
                        <span>رابط ملف الوسائط (فيديو ترويجي أو صورة)</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTab("media")}
                        className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>الملفات المرفوعة بالسيرفر</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="الصق الرابط (Videy, Catbox, YouTube, MP4, مباشر)..."
                          className="w-full glass-input-ar px-3.5 py-2.5 rounded-xl text-xs font-mono text-left"
                          dir="ltr"
                          value={formData.mediaUrl || ""}
                          onChange={(e) => handleMediaUrlInput(e.target.value)}
                        />
                      </div>
                      <div>
                        <select
                          className="w-full glass-input-ar px-3 py-2.5 rounded-xl text-xs bg-slate-900 font-bold"
                          value={formData.mediaType || "image"}
                          onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as MediaType })}
                        >
                          <option value="video">🎬 مقطع فيديو (Video)</option>
                          <option value="image">🖼️ صورة (Image)</option>
                        </select>
                      </div>
                    </div>

                    {/* Visual Detection Confirmation Badge */}
                    {formData.mediaUrl && (
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            تم التعرف الذكي: {formData.mediaType === "video" ? "مقطع فيديو ترويجي" : "صورة فائقة الدقة"}
                            {detectedMediaPlatform ? ` (${detectedMediaPlatform})` : ""}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Quick upload trigger right inside form */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
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
                        <span>{isUploading ? uploadProgress : "رفع مقطع فيديو أو صورة مباشرة من جهازك"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      الوصف التشويقي (يظهر في بطاقة تليجرام ومنصة X)
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
                      <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                        <span>رابط المشاهدة المخصص (اختياري)</span>
                        <span className="text-[10px] text-amber-400 font-normal">إذا تُرك فارغاً يتحول تلقائياً لرابط الإعلانات (Smartlink)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="ضع رابطاً مخصصاً (مثل: تيليجرام أو موقعك) أو اتركه فارغاً للتحويل إلى رابط الإعلانات فوراً"
                        className="w-full glass-input-ar px-3.5 py-2.5 rounded-xl text-xs font-mono text-left"
                        dir="ltr"
                        value={formData.ctaLink || ""}
                        onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Adsterra Integration Selector */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-gray-200">
                          نظام إعلانات Adsterra للصفحة
                        </span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-emerald-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.useDefaultAds}
                          onChange={(e) => setFormData({ ...formData, useDefaultAds: e.target.checked })}
                          className="w-4 h-4 accent-emerald-500 rounded"
                        />
                        <span>تطبيق إعلانات Adsterra الافتراضية للموقع</span>
                      </label>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      عند التفعيل، ستعمل جميع الوحدات الإعلانية المضبوطة في تبويب <strong>&quot;إدارة إعلانات Adsterra&quot;</strong> تلقائياً مع إمكانية إيقاف أو تعديل أي وحدة بنقرة زر واحدة.
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
                            كود بانر مخصص لهذه الصفحة فقط (300x250)
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
                    <span>{editingSlug ? "حفظ التعديلات وتحديث صفحة الهبوط" : "حفظ ونشر صفحة الهبوط وتفعيل الرابط المخصص"}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Live Smartphone Simulator with SmartMediaPlayer */}
            <div className="lg:col-span-5 flex flex-col items-center sticky top-20">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-3">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>المشغل المباشر على الهاتف (Mobile & Desktop Live Player)</span>
              </div>

              {/* Smartphone Frame */}
              <div className="w-[310px] sm:w-[340px] rounded-[44px] border-[6px] border-slate-700 bg-[#070a12] shadow-2xl overflow-hidden p-3 relative flex flex-col">
                {/* Notch */}
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

                {/* Inner Screen */}
                <div className="rounded-[28px] overflow-hidden bg-[#070a12] border border-white/10 flex-1 flex flex-col justify-between text-center p-3 text-white relative">

                  {/* Header in simulator */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                    <span className="text-[10px] font-black text-brand-400">XTREN VIP 4K</span>
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

                  {/* Smart Media Player Preview */}
                  <div className="w-full mb-3">
                    {formData.mediaUrl ? (
                      <SmartMediaPlayer
                        key={`${formData.mediaUrl}-${formData.mediaType}`}
                        mediaUrl={formData.mediaUrl}
                        mediaType={formData.mediaType}
                        title={formData.title}
                        ctaText={formData.ctaText}
                      />
                    ) : (
                      <div className="w-full aspect-video rounded-xl bg-black/80 border border-white/10 flex flex-col items-center justify-center text-gray-500 text-[10px] gap-1.5">
                        <Video className="w-6 h-6 text-gray-600" />
                        <span>المشغل الذكي سيعرض الفيديو أو الصورة هنا فور إدخال الرابط</span>
                      </div>
                    )}
                  </div>

                  {/* Simulated CTA Button */}
                  <div className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-accent-500 to-rose-600 text-white font-bold text-xs shadow-md mb-2 truncate">
                    {formData.ctaText || "⚡ مشاهدة الفيديو كاملاً بجودة 4K"}
                  </div>

                  {/* Simulated Ad Container */}
                  <div className="w-full rounded-lg bg-emerald-950/40 border border-emerald-500/30 py-2 text-[9px] text-emerald-300 font-bold">
                    إعلانات Adsterra (مفعلة وتعمل بانتظام)
                  </div>

                  {/* Footer in simulator */}
                  <div className="text-[8px] text-gray-600 pt-2 border-t border-white/5 mt-2">
                    © XTREN Media · مشغل آمن ومشفر 100%
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PUBLISHED PAGES MANAGER & EDITOR */}
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

                          <div className="flex items-center gap-2 pt-2 flex-wrap">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditPage(p)}
                              className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                              <span>تعديل الصفحة</span>
                            </button>

                            {/* Direct Preview Link */}
                            <a
                              href={`/p/${p.slug}`}
                              target="_blank"
                              className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                              <span>معاينة الرابط</span>
                            </a>

                            {/* Copy Link */}
                            <button
                              onClick={() => handleCopyLink(p.slug)}
                              className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-colors"
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

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeletePage(p.slug)}
                              className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 mr-auto transition-colors"
                              title="حذف الصفحة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Social Broadcast Toolbar */}
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

        {/* TAB 3: ADSTERRA CODES MANAGER WITH EDIT, ADD & TOGGLE ON/OFF */}
        {activeTab === "settings" && (
          <div className="space-y-6">

            {/* Master Control Bar */}
            <div className="glass-panel-luxury rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white">
                        مركز إدارة إعلانات Adsterra (إضافة · تعديل · تشغيل وإيقاف)
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        تحكم فوري وشامل في جميع الأكواد والوحدات الإعلانية مع إمكانية إيقاف أي إعلان دون حذف كوده.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  {/* Master Switch */}
                  <button
                    onClick={handleToggleMasterAds}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${masterAdsOn
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                      }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{masterAdsOn ? "كافة الإعلانات: مفعلة 🟢" : "كافة الإعلانات: متوقفة مؤقتاً 🔴"}</span>
                  </button>

                  {/* Save Settings */}
                  <button
                    onClick={handleSaveSettings}
                    className="btn-emerald-glow px-6 py-2.5 rounded-xl text-xs font-black shadow-lg"
                  >
                    حفظ وتثبيت كافة التعديلات الآن
                  </button>
                </div>
              </div>

              {/* Grid of the 11 Adsterra Ad Formats with Individual On/Off Switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {ADSTERRA_SLOTS.map((slot) => {
                  const currentCode = (settings.defaultAds as any)?.[slot.key] || "";
                  const slotStatus = settings.defaultAds?.status?.[slot.key];
                  // Default is active (true) unless explicitly false
                  const isSlotActive = masterAdsOn && slotStatus !== false && Boolean(currentCode.trim());
                  const isConfigured = Boolean(currentCode.trim());

                  return (
                    <div
                      key={slot.key}
                      className={`glass-card-subtle p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${isSlotActive
                          ? "border-emerald-500/40 bg-emerald-950/15 shadow-lg shadow-emerald-950/30"
                          : isConfigured
                            ? "border-amber-500/30 bg-amber-950/10 opacity-80"
                            : "border-white/5 opacity-70"
                        }`}
                    >
                      {/* Top Header of Card with Toggle Switch */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                            ID: {slot.id}
                          </span>

                          {/* Toggle ON/OFF Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleAdSlot(slot.key)}
                            disabled={!currentCode.trim()}
                            title={isSlotActive ? "إيقاف الإعلان مؤقتاً" : "تشغيل الإعلان"}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isSlotActive
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isSlotActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                            <span>{isSlotActive ? "نشط ويعمل" : "متوقف مؤقتاً"}</span>
                          </button>
                        </div>

                        <h3 className="text-xs font-bold text-white leading-snug">
                          {slot.name}
                        </h3>

                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 font-medium text-brand-300">
                            {slot.placement}
                          </span>
                        </div>
                      </div>

                      {/* Code Textarea / Input */}
                      <div className="space-y-1.5">
                        {slot.type === "direct" ? (
                          <input
                            type="url"
                            placeholder="https://... رابط الربح المباشر Smartlink"
                            className="w-full glass-input-ar p-2.5 rounded-xl text-xs font-mono text-emerald-300 text-left"
                            dir="ltr"
                            value={currentCode}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                defaultAds: {
                                  ...(settings.defaultAds || {}),
                                  [slot.key]: e.target.value,
                                },
                              })
                            }
                          />
                        ) : (
                          <textarea
                            rows={3}
                            placeholder="الصق كود الإعلان البرمجي هنا..."
                            className="w-full glass-input-ar p-2.5 rounded-xl text-xs font-mono text-emerald-300 text-left"
                            dir="ltr"
                            value={currentCode}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                defaultAds: {
                                  ...(settings.defaultAds || {}),
                                  [slot.key]: e.target.value,
                                },
                              })
                            }
                          />
                        )}

                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          {slot.desc}
                        </p>
                      </div>

                      {/* Bottom Action Buttons */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-[10px] text-gray-500">
                          {isSlotActive ? "🟢 مفعل في صفحات الهبوط" : "🔴 غير مفعل حالياً"}
                        </span>

                        {currentCode && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من مسح كود "${slot.name}"؟`)) {
                                setSettings({
                                  ...settings,
                                  defaultAds: {
                                    ...(settings.defaultAds || {}),
                                    [slot.key]: "",
                                  },
                                });
                              }
                            }}
                            className="text-rose-400 hover:text-rose-300 text-[10px] underline"
                          >
                            مسح الكود
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Save Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs text-gray-400">
                  سيتم تطبيق أي تعديل أو إيقاف فورياً على جميع صفحات الهبوط الحالية والجديدة.
                </span>
                <button
                  onClick={handleSaveSettings}
                  className="btn-emerald-glow px-6 py-2.5 rounded-xl text-xs font-black shadow-lg"
                >
                  حفظ وتفعيل التعديلات
                </button>
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
                      className="w-full glass-input-ar px-3.5 py-2 rounded-xl text-xs font-mono text-left"
                      dir="ltr"
                      value={settings.telegramBotToken || ""}
                      onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">معرف القناة (Channel ID)</label>
                    <input
                      type="text"
                      placeholder="@my_channel_username أو -1001234567890"
                      className="w-full glass-input-ar px-3.5 py-2 rounded-xl text-xs font-mono text-left"
                      dir="ltr"
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
                        className="w-full glass-input-ar px-3 py-2 rounded-xl text-xs font-mono text-left"
                        dir="ltr"
                        value={settings.twitterApiKey || ""}
                        onChange={(e) => setSettings({ ...settings, twitterApiKey: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">API Secret</label>
                      <input
                        type="password"
                        placeholder="API Secret"
                        className="w-full glass-input-ar px-3 py-2 rounded-xl text-xs font-mono text-left"
                        dir="ltr"
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
                        className="w-full glass-input-ar px-3 py-2 rounded-xl text-xs font-mono text-left"
                        dir="ltr"
                        value={settings.twitterAccessToken || ""}
                        onChange={(e) => setSettings({ ...settings, twitterAccessToken: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Token Secret</label>
                      <input
                        type="password"
                        placeholder="Token Secret"
                        className="w-full glass-input-ar px-3 py-2 rounded-xl text-xs font-mono text-left"
                        dir="ltr"
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
                      placeholder="https://xtren-hub-2026.web.app"
                      className="w-full glass-input-ar px-3.5 py-2.5 rounded-xl text-xs font-mono text-left"
                      dir="ltr"
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

            {/* Admin Security & Password Change Section */}
            <div className="glass-panel-luxury rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-400" />
                  أمان لوحة التحكم وكلمة المرور
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  يمكنك تغيير كلمة المرور المخصصة للدخول إلى لوحة التحكم لحماية حسابك وحملاتك وصفحاتك
                </p>
              </div>

              {passChangeMsg && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                    passChangeMsg.type === "success"
                      ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/80 border-rose-500/40 text-rose-300"
                  }`}
                >
                  {passChangeMsg.type === "success" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{passChangeMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    كلمة المرور الحالية
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="أدخل كلمة المرور الحالية..."
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    className="w-full glass-input-ar px-3.5 py-2.5 rounded-xl text-xs font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="كلمة مرور جديدة (4 خانات+)..."
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    className="w-full glass-input-ar px-3.5 py-2.5 rounded-xl text-xs font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="أعد كتابة كلمة المرور..."
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    className="w-full glass-input-ar px-3.5 py-2.5 rounded-xl text-xs font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passChangeLoading}
                    className="btn-accent-glow px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {passChangeLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>تحديث كلمة المرور الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* TAB 4: MEDIA & FILE STORAGE MANAGER */}
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
                            handleMediaUrlInput(file.url);
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

      </div>
    </div>
  );
}
