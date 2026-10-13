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

// GET: Retrieve all landing pages or a specific page by slug from Firebase Firestore
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const page = await getFirebasePageBySlug(slug);
      if (!page) {
        return NextResponse.json(
          { success: false, error: "الصفحة غير موجودة في قاعدة بيانات Firebase" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, page });
    }

    const pages = await getAllPagesFromFirebase();
    return NextResponse.json({ success: true, pages });
  } catch (error: any) {
    console.error("GET /api/pages error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل جلب الصفحات من Firebase" },
      { status: 500 }
    );
  }
}

// POST: Save or update a landing page directly in Firebase Firestore
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

    const saved = await savePageToFirebase(page);
    return NextResponse.json({
      success: true,
      message: "تم حفظ ونشر صفحة الهبوط بنجاح في قاعدة بيانات Firebase",
      page: saved,
    });
  } catch (error: any) {
    console.error("POST /api/pages error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل حفظ الصفحة في Firebase" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a landing page directly from Firebase Firestore
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
        { success: false, error: "فشل حذف الصفحة من قاعدة بيانات Firebase" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف الصفحة /p/${slug} بنجاح من قاعدة بيانات Firebase`,
    });
  } catch (error: any) {
    console.error("DELETE /api/pages error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل حذف الصفحة من Firebase" },
      { status: 500 }
    );
  }
}
