import { NextRequest, NextResponse } from "next/server";
import { resolveIbbUrl, resolveMediaInfo, detectMediaType, cleanMediaInputUrl } from "@/lib/mediaResolver";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return NextResponse.json({ success: false, error: "Missing url parameter" }, { status: 400 });
    }

    const cleaned = cleanMediaInputUrl(rawUrl);
    const resolvedUrl = await resolveIbbUrl(cleaned);
    const info = resolveMediaInfo(resolvedUrl);

    return NextResponse.json({
      success: true,
      originalUrl: rawUrl,
      resolvedUrl: resolvedUrl,
      mediaType: info.kind === "video" || info.kind === "embed" ? "video" : "image",
      platform: info.platform,
      embedUrl: info.embedUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body?.url;

    if (!rawUrl) {
      return NextResponse.json({ success: false, error: "Missing url in body" }, { status: 400 });
    }

    const cleaned = cleanMediaInputUrl(rawUrl);
    const resolvedUrl = await resolveIbbUrl(cleaned);
    const info = resolveMediaInfo(resolvedUrl);

    return NextResponse.json({
      success: true,
      originalUrl: rawUrl,
      resolvedUrl: resolvedUrl,
      mediaType: info.kind === "video" || info.kind === "embed" ? "video" : "image",
      platform: info.platform,
      embedUrl: info.embedUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
