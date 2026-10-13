import { NextRequest, NextResponse } from "next/server";
import { getFirebaseSettings, saveFirebaseSettings } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const AUTH_COOKIE_NAME = "xtren_admin_token";
const TOKEN_SECRET = "xtren_secure_session_key_2026";

function generateSessionToken(password: string): string {
  const payload = Buffer.from(JSON.stringify({
    role: "admin",
    passHash: Buffer.from(password).toString("base64"),
    timestamp: Date.now(),
  })).toString("base64");
  return `${payload}.${Buffer.from(TOKEN_SECRET).toString("base64")}`;
}

function verifySessionToken(token: string, currentPassword: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const expectedSecret = Buffer.from(TOKEN_SECRET).toString("base64");
    if (parts[1] !== expectedSecret) return false;

    const data = JSON.parse(Buffer.from(parts[0], "base64").toString("utf-8"));
    if (data.role !== "admin") return false;

    const currentHash = Buffer.from(currentPassword).toString("base64");
    return data.passHash === currentHash;
  } catch {
    return false;
  }
}

// GET: Check authentication status
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const settings = await getFirebaseSettings();
    const currentPassword = settings.adminPassword || process.env.ADMIN_PASSWORD || "admin2026";

    if (token && verifySessionToken(token, currentPassword)) {
      return NextResponse.json({ success: true, authenticated: true });
    }

    return NextResponse.json({ success: true, authenticated: false });
  } catch (error: any) {
    return NextResponse.json({ success: false, authenticated: false, error: error.message }, { status: 500 });
  }
}

// POST: Login / Logout / Change Password
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action || "login";
    const settings = await getFirebaseSettings();
    const currentPassword = settings.adminPassword || process.env.ADMIN_PASSWORD || "admin2026";

    // 1. LOGIN
    if (action === "login") {
      const password = (body?.password || "").trim();

      if (!password) {
        return NextResponse.json(
          { success: false, error: "يرجى كتابة كلمة المرور" },
          { status: 400 }
        );
      }

      if (password !== currentPassword) {
        return NextResponse.json(
          { success: false, error: "كلمة المرور غير صحيحة! يرجى التأكد والمحاولة مجدداً." },
          { status: 401 }
        );
      }

      const token = generateSessionToken(currentPassword);
      const res = NextResponse.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح إلى لوحة الإدارة",
      });

      // Set auth cookie for 7 days
      res.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return res;
    }

    // 2. LOGOUT
    if (action === "logout") {
      const res = NextResponse.json({
        success: true,
        message: "تم تسجيل الخروج وقفل لوحة التحكم بنجاح",
      });

      res.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: "",
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });

      return res;
    }

    // 3. CHANGE PASSWORD
    if (action === "change_password") {
      const oldPassword = (body?.oldPassword || "").trim();
      const newPassword = (body?.newPassword || "").trim();

      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json(
          { success: false, error: "كلمة المرور الجديدة يجب أن تكون 4 أحرف أو أرقام على الأقل" },
          { status: 400 }
        );
      }

      if (oldPassword !== currentPassword) {
        return NextResponse.json(
          { success: false, error: "كلمة المرور الحالية غير صحيحة" },
          { status: 401 }
        );
      }

      // Update password
      await saveFirebaseSettings({
        ...settings,
        adminPassword: newPassword,
      });

      // Generate new token for new password
      const newToken = generateSessionToken(newPassword);
      const res = NextResponse.json({
        success: true,
        message: "تم تحديث كلمة المرور بنجاح!",
      });

      res.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    return NextResponse.json({ success: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: any) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "حدث خطأ في الخادم" }, { status: 500 });
  }
}
