import { NextRequest, NextResponse } from "next/server";
import { LandingPageData } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/mediaResolver";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      page, 
      botToken: customBotToken, 
      channelId: customChannelId,
      siteUrl: customSiteUrl,
      customCaption 
    } = body as {
      page: LandingPageData;
      botToken?: string;
      channelId?: string;
      siteUrl?: string;
      customCaption?: string;
    };

    if (!page || !page.slug) {
      return NextResponse.json(
        { error: "Page data and slug are required" },
        { status: 400 }
      );
    }

    const token = customBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const channel = customChannelId || process.env.TELEGRAM_CHANNEL_ID;

    if (!token || !channel) {
      return NextResponse.json(
        { 
          error: "Telegram Bot Token and Channel ID are required. Please configure them in Admin Settings or .env.local" 
        },
        { status: 400 }
      );
    }

    // Determine target public URL
    const origin = customSiteUrl || req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://trendx-opal.vercel.app";
    const pageUrl = `${origin}/p/${page.slug}`;

    // Format caption with HTML
    const titleText = page.title || "Exclusive Premiere";
    const descText = page.description ? `\n\n${page.description}` : "";
    const caption = customCaption || `🔥 <b>${titleText}</b>${descText}\n\n👇 <i>Tap the button below to watch full video in 4K HD:</i>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: `🎬 ${page.ctaText || "Watch Full HD Video Now"}`,
            url: pageUrl,
          },
        ],
      ],
    };

    const resolvedMedia = resolveMediaUrl(page.mediaUrl || "");

    let telegramEndpoint = `https://api.telegram.org/bot${token}/sendMessage`;
    let payload: any = {
      chat_id: channel,
      text: `${caption}\n\n🔗 ${pageUrl}`,
      parse_mode: "HTML",
      reply_markup: inlineKeyboard,
    };

    // If page has a valid direct image URL, use sendPhoto
    if (resolvedMedia && page.mediaType === "image") {
      telegramEndpoint = `https://api.telegram.org/bot${token}/sendPhoto`;
      payload = {
        chat_id: channel,
        photo: resolvedMedia,
        caption: caption,
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      };
    } else if (resolvedMedia && page.mediaType === "video" && (resolvedMedia.endsWith(".mp4") || resolvedMedia.includes("video") || resolvedMedia.includes("cdn.videy.co"))) {
      telegramEndpoint = `https://api.telegram.org/bot${token}/sendVideo`;
      payload = {
        chat_id: channel,
        video: resolvedMedia,
        caption: caption,
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      };
    }

    const response = await fetch(telegramEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json(
        { 
          error: data.description || "Failed to broadcast to Telegram",
          details: data 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully broadcasted to Telegram Channel!",
      messageId: data.result?.message_id,
      pageUrl,
    });
  } catch (error: any) {
    console.error("Telegram broadcast error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error broadcasting to Telegram" },
      { status: 500 }
    );
  }
}
