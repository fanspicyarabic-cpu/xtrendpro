import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.FIREBASE_CONFIG ||
    process.env.K_SERVICE ||
    process.env.FUNCTION_NAME
);
const UPLOAD_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), "xtren-uploads")
  : path.join(process.cwd(), "public", "uploads");

function ensureUploadDir() {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("ensureUploadDir error:", err);
  }
}

/**
 * Fetch uploaded file records stored in Firestore
 */
async function getFirestoreUploads(): Promise<any[]> {
  try {
    if (!db) return [];
    const colRef = collection(db, "uploads");
    const snap = await getDocs(colRef);
    const files: any[] = [];
    snap.forEach((d) => files.push(d.data()));
    return files;
  } catch (e) {
    console.warn("getFirestoreUploads warning:", e);
    return [];
  }
}

/**
 * Persist an upload record to Firestore
 */
async function saveFirestoreUpload(fileRecord: any): Promise<void> {
  try {
    if (!db) return;
    const docId = encodeURIComponent(
      fileRecord.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)
    );
    await setDoc(doc(db, "uploads", docId), fileRecord, { merge: true });
  } catch (e) {
    console.warn("saveFirestoreUpload warning:", e);
  }
}

/**
 * Delete an upload record from Firestore
 */
async function deleteFirestoreUpload(fileName: string): Promise<void> {
  try {
    if (!db) return;
    const docId = encodeURIComponent(
      fileName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)
    );
    await deleteDoc(doc(db, "uploads", docId));
  } catch (e) {
    console.warn("deleteFirestoreUpload warning:", e);
  }
}

// GET: List all uploaded files for the Media Gallery (from Firestore + Local)
export async function GET() {
  try {
    ensureUploadDir();
    const mediaMap = new Map<string, any>();

    // 1. Load from Firestore (permanent across all lambdas / deployments)
    const firestoreFiles = await getFirestoreUploads();
    for (const f of firestoreFiles) {
      if (f && f.name) {
        mediaMap.set(f.name, f);
      }
    }

    // 2. Load from local filesystem if accessible
    if (fs.existsSync(UPLOAD_DIR)) {
      try {
        const files = fs.readdirSync(UPLOAD_DIR);
        for (const file of files) {
          if (file.startsWith(".")) continue;
          const filePath = path.join(UPLOAD_DIR, file);
          const stats = fs.statSync(filePath);
          const ext = path.extname(file).toLowerCase();
          const isVideo = [".mp4", ".webm", ".mov", ".m4v"].includes(ext);
          const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext);

          if (!mediaMap.has(file)) {
            mediaMap.set(file, {
              name: file,
              url: `/uploads/${file}`,
              size: stats.size,
              createdAt: stats.birthtime.toISOString(),
              type: isVideo ? "video" : isImage ? "image" : "other",
            });
          }
        }
      } catch (err) {
        console.warn("Local dir read warning:", err);
      }
    }

    const mediaList = Array.from(mediaMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return NextResponse.json({ success: true, files: mediaList });
  } catch (error: any) {
    return NextResponse.json({ success: true, files: [] });
  }
}

// POST: Upload single or multiple files or register a cloud-uploaded file
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Case A: Register a file that was uploaded directly from browser to CDN (e.g. Videy / Litterbox)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.action === "register" && body.file) {
        const fileData = {
          name: body.file.name,
          url: body.file.url,
          size: body.file.size || 0,
          type: body.file.type || "video",
          createdAt: body.file.createdAt || new Date().toISOString(),
          platform: body.file.platform || "Cloud CDN",
        };
        await saveFirestoreUpload(fileData);
        return NextResponse.json({
          success: true,
          message: "تم تسجيل الملف بنجاح في قاعدة البيانات",
          file: fileData,
        });
      }
    }

    // Case B: Standard FormData Upload
    ensureUploadDir();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "لم يتم اختيار أي ملف للرفع" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name).toLowerCase();
    const baseName = path.basename(file.name, ext).replace(/[^\w\d-_]/g, "_").slice(0, 30);
    const uniqueFileName = `${Date.now()}_${baseName}${ext}`;

    const isVideo = [".mp4", ".webm", ".mov", ".m4v"].includes(ext);
    const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext);

    let finalPublicUrl = `/uploads/${uniqueFileName}`;
    let platform = "Local Storage";

    // 1. If it's a video, attempt uploading to Videy.co API for instant, permanent, high-speed CDN streaming
    if (isVideo) {
      try {
        const videyFormData = new FormData();
        videyFormData.append(
          "file",
          new Blob([buffer], { type: file.type || "video/mp4" }),
          uniqueFileName
        );

        const videyRes = await fetch("https://videy.co/api/upload", {
          method: "POST",
          body: videyFormData,
        });

        if (videyRes.ok) {
          const videyData = await videyRes.json();
          if (videyData && videyData.id) {
            finalPublicUrl = `https://cdn.videy.co/${videyData.id}.${ext.replace(".", "") || "mp4"}`;
            platform = "Videy.co CDN";
          }
        }
      } catch (e) {
        console.warn("Videy server proxy upload warning:", e);
      }
    } else if (isImage) {
      // 2. If it's an image, attempt uploading to Litterbox for persistent public URL
      try {
        const litterData = new FormData();
        litterData.append("reqtype", "fileupload");
        litterData.append("time", "72h");
        litterData.append(
          "fileToUpload",
          new Blob([buffer], { type: file.type || "image/jpeg" }),
          uniqueFileName
        );

        const litterRes = await fetch(
          "https://litterbox.catbox.moe/resources/internals/api.php",
          {
            method: "POST",
            body: litterData,
          }
        );

        if (litterRes.ok) {
          const directUrl = (await litterRes.text()).trim();
          if (directUrl.startsWith("http")) {
            finalPublicUrl = directUrl;
            platform = "Cloud CDN";
          }
        }
      } catch (e) {
        console.warn("Litterbox upload warning:", e);
      }
    }

    // Always attempt local write as cache / fallback
    try {
      const filePath = path.join(UPLOAD_DIR, uniqueFileName);
      fs.writeFileSync(filePath, buffer);
    } catch (e) {
      console.warn("Local disk write warning:", e);
    }

    const fileData = {
      name: uniqueFileName,
      url: finalPublicUrl,
      size: buffer.length,
      type: isVideo ? "video" : isImage ? "image" : "other",
      createdAt: new Date().toISOString(),
      platform,
    };

    // Save record to Firestore so it never disappears on serverless restarts
    await saveFirestoreUpload(fileData);

    return NextResponse.json({
      success: true,
      message: "تم رفع وتخزين الملف بنجاح!",
      file: fileData,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "حدث خطأ أثناء رفع الملف" },
      { status: 500 }
    );
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

    // Delete from Firestore
    await deleteFirestoreUpload(sanitized);

    // Delete from local disk if present
    const filePath = path.join(UPLOAD_DIR, sanitized);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("Unlink warning:", e);
      }
    }

    return NextResponse.json({ success: true, message: "تم حذف الملف بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
