import React from "react";
import Link from "next/link";
import { 
  Radio, 
  Send, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  Layers, 
  ExternalLink, 
  Eye,
  Sliders,
  FolderOpen,
  CheckCircle2
} from "lucide-react";

export default function HomePageArabic() {
  return (
    <div className="min-h-screen bg-[#070b13] text-white flex flex-col justify-between selection:bg-brand-500 selection:text-white" dir="rtl">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-brand-500/15 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-accent-500/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 via-sky-500 to-accent-500 flex items-center justify-center font-black text-xl shadow-lg shadow-sky-500/25">
              X
            </div>
            <span className="font-black text-lg tracking-wide bg-gradient-to-l from-brand-400 via-white to-accent-500 bg-clip-text text-transparent">
              منصة XTREN الحصرية
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="btn-cyan-glow px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>لوحة التحكم المركزية</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 flex-1 flex flex-col items-center justify-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-sky-300 mb-6 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>الجيل الأحدث لنشر صفحات الهبوط والربح من Adsterra والبث التلقائي</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl leading-[1.25] mb-6">
          صفحات هبوط ديناميكية فائقة التحويل لزيادة <span className="bg-gradient-to-l from-brand-400 via-sky-200 to-accent-500 bg-clip-text text-transparent">أرباح الإعلانات والترافيك</span>
        </h1>

        <p className="text-gray-400 text-sm sm:text-base max-w-2xl mb-10 leading-relaxed">
          أنشئ صفحات هبوط مخصصة للفيديو والصور مع نظام رفع وتخزين ملفات الميديا، بطاقات Open Graph ذكية للبث التلقائي في قنوات تيليجرام مع أزرار مضمنة والنشر المباشر على منصة X.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            href="/admin"
            className="btn-cyan-glow px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-brand-500/30"
          >
            <Sliders className="w-4 h-4" />
            <span>الدخول إلى لوحة الإدارة والتحكم</span>
          </Link>

          <Link
            href="/p/test-model-premiere-4k"
            className="glass-card-subtle px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base text-gray-200 hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-rose-400" />
            <span>معاينة صفحة هبوط نموذجية</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>

        {/* Features 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-right">
          {/* Card 1 */}
          <div className="glass-panel-luxury p-6 rounded-3xl border border-white/10 hover:border-sky-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-white">تخزين ورفع ملفات الميديا</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              ارفع مقاطع الفيديو والصور مباشرة من جهازك مع التخزين في السيرفر والحصول على روابط فورية لإدراجها في صفحات الهبوط.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel-luxury p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-white">تحقيق أقصى ربح من Adsterra</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              حقن ذكي لسكريبتات البانر والسوشيال بار والبوب أندر مع ضمان تشغيلها الفوري بدون التأثير على سرعة تحميل الصفحة.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel-luxury p-6 rounded-3xl border border-white/10 hover:border-rose-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-white">بث تيليجرام ومنصة X</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              بث تلقائي بضغطة زر مع أزرار تفاعلية مضمنة في تيليجرام، وتغريدات جاهزة مع كروت معاينة احترافية لجلب آلاف الزيارات.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-6 text-center text-xs text-gray-500 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} منصة XTREN · جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <Link href="/admin" className="hover:text-white transition-colors">لوحة التحكم</Link>
            <Link href="/p/test-model-premiere-4k" className="hover:text-white transition-colors">صفحة تجريبية</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
