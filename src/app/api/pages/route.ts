import { NextRequest, NextResponse } from "next/server";
import { getStoredPages, saveStoredPage, deleteStoredPage } from "@/lib/serverDb";
import { getPageForServer } from "@/lib/firebaseAdmin";
import { LandingPageData } from "@/lib/types";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fanspicyrabic";
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAz1AHssprR5V0fKJEnhew0riAqGMAf0WU";

// GET: Retrieve all landing pages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const localPages = getStoredPages();

    if (slug) {
      let page = localPages.find((p) => p.slug === slug);
      if (!page) {
        page = (await getPageForServer(slug)) || undefined;
      }
      if (!page) {
        return NextResponse.json({ success: false, error: "الصفحة غير موجودة" }, { status: 404 });
      }
      return NextResponse.json({ success: true, page });
    }

    // Fetch from Firestore to merge any newly created pages across all lambdas
    const allPagesMap = new Map<string, LandingPageData>();
    localPages.forEach((p) => allPagesMap.set(p.slug, p));

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/pages?key=${FIREBASE_API_KEY}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.documents)) {
          data.documents.forEach((d: any) => {
            const f = d.fields;
            if (f && f.slug?.stringValue) {
              const s = f.slug.stringValue;
              const adsFields = f.ads?.mapValue?.fields || {};
              allPagesMap.set(s, {
                slug: s,
                title: f.title?.stringValue || "عرض حصري",
                description: f.description?.stringValue || "",
                mediaUrl: f.mediaUrl?.stringValue || "",
                mediaType: (f.mediaType?.stringValue as any) || "image",
                adCode: f.adCode?.stringValue || "",
                ctaText: f.ctaText?.stringValue || "",
                ctaLink: f.ctaLink?.stringValue || "",
                views: Number(f.views?.integerValue || 120),
                clicks: Number(f.clicks?.integerValue || 0),
                createdAt: f.createdAt?.stringValue || new Date().toISOString(),
                updatedAt: f.updatedAt?.stringValue || new Date().toISOString(),
                ads: {
                  socialBar: adsFields.socialBar?.stringValue || "",
                  popunder: adsFields.popunder?.stringValue || "",
                  smartlink: adsFields.smartlink?.stringValue || "",
                  banner300x250: adsFields.banner300x250?.stringValue || "",
                  banner728x90: adsFields.banner728x90?.stringValue || "",
                  banner320x50: adsFields.banner320x50?.stringValue || "",
                  banner468x60: adsFields.banner468x60?.stringValue || "",
                  banner160x600: adsFields.banner160x600?.stringValue || "",
                  banner160x300: adsFields.banner160x300?.stringValue || "",
                },
              });
            }
          });
        }
      }
    } catch (e) {
      // Ignore network errors and return local list
    }

    const merged = Array.from(allPagesMap.values());
    return NextResponse.json({ success: true, pages: merged });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save or update a landing page persistently
export async function POST(req: NextRequest) {
  try {
    const page = (await req.json()) as LandingPageData;

    if (!page || !page.slug || !page.title || !page.mediaUrl) {
      return NextResponse.json(
        { success: false, error: "يرجى ملء جميع الحقول المطلوبة (الرابط المخصص، العنوان، ورابط الوسائط)" },
        { status: 400 }
      );
    }

    const saved = saveStoredPage(page);
    return NextResponse.json({
      success: true,
      message: "تم حفظ ونشر صفحة الهبوط بنجاح في قاعدة البيانات",
      page: saved,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a landing page
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ success: false, error: "معرف الرابط slug مطلوب" }, { status: 400 });
    }

    deleteStoredPage(slug);
    return NextResponse.json({ success: true, message: `تم حذف الصفحة /p/${slug} بنجاح` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
