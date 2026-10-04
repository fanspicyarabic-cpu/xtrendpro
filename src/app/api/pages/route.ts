import { NextRequest, NextResponse } from "next/server";
import { getStoredPages, saveStoredPage, deleteStoredPage } from "@/lib/serverDb";
import { LandingPageData } from "@/lib/types";

// GET: Retrieve all landing pages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const pages = getStoredPages();

    if (slug) {
      const page = pages.find((p) => p.slug === slug);
      if (!page) {
        return NextResponse.json({ success: false, error: "الصفحة غير موجودة" }, { status: 404 });
      }
      return NextResponse.json({ success: true, page });
    }

    return NextResponse.json({ success: true, pages });
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
