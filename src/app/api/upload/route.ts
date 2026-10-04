import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// GET: List all uploaded files for the Media Gallery
export async function GET() {
  try {
    ensureUploadDir();
    const files = fs.readdirSync(UPLOAD_DIR);
    const mediaList = files
      .filter((file) => !file.startsWith("."))
      .map((file) => {
        const filePath = path.join(UPLOAD_DIR, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file).toLowerCase();
        const isVideo = [".mp4", ".webm", ".mov", ".m4v"].includes(ext);
        const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext);

        return {
          name: file,
          url: `/uploads/${file}`,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          type: isVideo ? "video" : isImage ? "image" : "other",
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, files: mediaList });
  } catch (error: any) {
    console.error("Error reading uploads directory:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Upload single or multiple files
export async function POST(req: NextRequest) {
  try {
    ensureUploadDir();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "لم يتم اختيار أي ملف للرفع" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique name
    const ext = path.extname(file.name).toLowerCase();
    const baseName = path.basename(file.name, ext).replace(/[^\w\d-_]/g, "_").slice(0, 30);
    const uniqueFileName = `${Date.now()}_${baseName}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);

    fs.writeFileSync(filePath, buffer);

    const isVideo = [".mp4", ".webm", ".mov", ".m4v"].includes(ext);
    const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext);

    const fileData = {
      name: uniqueFileName,
      url: `/uploads/${uniqueFileName}`,
      size: buffer.length,
      type: isVideo ? "video" : isImage ? "image" : "other",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "تم رفع الملف بنجاح وتخزينه في الخادم",
      file: fileData,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: error.message || "حدث خطأ أثناء رفع الملف" }, { status: 500 });
  }
}

// DELETE: Delete an uploaded file
export async function DELETE(req: NextRequest) {
  try {
    ensureUploadDir();
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("name");

    if (!fileName) {
      return NextResponse.json({ success: false, error: "اسم الملف مطلوب" }, { status: 400 });
    }

    const sanitized = path.basename(fileName);
    const filePath = path.join(UPLOAD_DIR, sanitized);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true, message: "تم حذف الملف بنجاح" });
    }

    return NextResponse.json({ success: false, error: "الملف غير موجود" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
