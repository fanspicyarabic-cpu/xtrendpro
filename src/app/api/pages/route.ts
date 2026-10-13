import { NextRequest, NextResponse } from "next/server";
import {
  getAllPagesFromFirebase,
  getFirebasePageBySlug,
  savePageToFirebase,
  deletePageFromFirebase,
} from "@/lib/firebaseAdmin";
import { LandingPageData } from "@/lib/types";

// Force dynamic execution for API routes
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Retrieve all landing pages or a specific page by slug
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const page = await getFirebasePageBySlug(slug);
      if (!page) {
        return NextResponse.json(
          { success: false, error: "الصفحة المطلوبة غير موجودة في السجل" },
          {
            status: 404,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            },
          }
        );
      }
      return NextResponse.json(
        { success: true, page },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        }
      );
    }

    const pages = await getAllPagesFromFirebase();
    return NextResponse.json(
      { success: true, pages },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/pages error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل جلب الصفحات من السجل" },
      { status: 500 }
    );
  }
}

// POST: Save or update a landing page directly in database/local record
export async function POST(req: NextRequest) {
  try {
    const page = (await req.json()) as LandingPageData;

    if (!page || !page.slug || !page.title || !page.mediaUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "يرجى ملء جميع الحقول المطلوبة (الرابط المخصص slug، العنوان، ورابط الوسائط)",
        },
        { status: 400 }
      );
    }

    // Clean potential pasted embeds & resolve ImgBB viewer links to direct CDN image URLs
    const { cleanMediaInputUrl, resolveIbbUrl } = await import("@/lib/mediaResolver");
    const cleanedMediaUrl = cleanMediaInputUrl(page.mediaUrl);
    const resolvedMediaUrl = await resolveIbbUrl(cleanedMediaUrl);
    page.mediaUrl = resolvedMediaUrl;

    const saved = await savePageToFirebase(page);
    return NextResponse.json(
      {
        success: true,
        message: "تم حفظ ونشر صفحة الهبوط بنجاح وتخزينها في السجل",
        page: saved,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("POST /api/pages error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل حفظ الصفحة في السجل" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a landing page from record
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "معرف الرابط slug مطلوب للحذف" },
        { status: 400 }
      );
    }

    const success = await deletePageFromFirebase(slug);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "فشل حذف الصفحة من السجل" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف الصفحة /p/${slug} بنجاح من السجل`,
    });
  } catch (error: any) {
    console.error("DELETE /api/pages error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل حذف الصفحة من السجل" },
      { status: 500 }
    );
  }
}

