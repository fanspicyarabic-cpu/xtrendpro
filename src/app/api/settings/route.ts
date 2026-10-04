import { NextRequest, NextResponse } from "next/server";
import { getStoredSettings, saveStoredSettings } from "@/lib/serverDb";
import { AdminSettings } from "@/lib/types";

// GET: Retrieve Admin Settings
export async function GET() {
  try {
    const settings = getStoredSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save or Update Admin Settings (including multi-format Adsterra default ads)
export async function POST(req: NextRequest) {
  try {
    const newSettings = (await req.json()) as AdminSettings;
    const current = getStoredSettings();
    const updated = saveStoredSettings({
      ...current,
      ...newSettings,
    });

    return NextResponse.json({
      success: true,
      message: "تم حفظ إعدادات وأكواد إعلانات Adsterra بنجاح!",
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
