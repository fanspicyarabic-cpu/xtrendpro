import { NextRequest, NextResponse } from "next/server";
import { getFirebaseSettings, saveFirebaseSettings } from "@/lib/firebaseAdmin";
import { AdminSettings } from "@/lib/types";

// Force dynamic execution for API routes
export const dynamic = "force-dynamic";

// GET: Retrieve Admin Settings directly from Firebase Firestore (settings/general)
export async function GET() {
  try {
    const settings = await getFirebaseSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل جلب الإعدادات من Firebase" },
      { status: 500 }
    );
  }
}

// POST: Save or Update Admin Settings directly in Firebase Firestore (settings/general)
export async function POST(req: NextRequest) {
  try {
    const newSettings = (await req.json()) as AdminSettings;
    const updated = await saveFirebaseSettings(newSettings);

    return NextResponse.json({
      success: true,
      message: "تم حفظ وتحديث الإعدادات بنجاح في قاعدة بيانات Firebase!",
      settings: updated,
    });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل حفظ الإعدادات في Firebase" },
      { status: 500 }
    );
  }
}
