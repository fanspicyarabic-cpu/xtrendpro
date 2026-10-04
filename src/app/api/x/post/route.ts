import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { LandingPageData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      page, 
      userAccessToken,
      apiKey,
      apiSecret,
      accessToken,
      accessSecret,
      siteUrl: customSiteUrl,
      customTweetText
    } = body as {
      page: LandingPageData;
      userAccessToken?: string;
      apiKey?: string;
      apiSecret?: string;
      accessToken?: string;
      accessSecret?: string;
      siteUrl?: string;
      customTweetText?: string;
    };

    if (!page || !page.slug) {
      return NextResponse.json(
        { error: "Landing page data with slug is required" },
        { status: 400 }
      );
    }

    const origin = customSiteUrl || req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://xtren.vercel.app";
    const pageUrl = `${origin}/p/${page.slug}`;

    const defaultText = `${page.title}\n\n🔞 Watch full exclusive 4K cut here:\n${pageUrl}\n\n#viral #exclusive #trend`;
    const tweetText = customTweetText || defaultText;

    // Check auth methods:
    // Method 1: OAuth 2.0 User Access Token
    if (userAccessToken || process.env.TWITTER_USER_ACCESS_TOKEN) {
      const token = userAccessToken || process.env.TWITTER_USER_ACCESS_TOKEN!;
      const client = new TwitterApi(token);
      const res = await client.v2.tweet(tweetText);
      return NextResponse.json({
        success: true,
        message: "Successfully posted to X (Twitter) via OAuth 2.0!",
        tweetId: res.data.id,
        pageUrl,
      });
    }

    // Method 2: OAuth 1.0a User Context
    const finalApiKey = apiKey || process.env.TWITTER_API_KEY;
    const finalApiSecret = apiSecret || process.env.TWITTER_API_SECRET;
    const finalAccessToken = accessToken || process.env.TWITTER_ACCESS_TOKEN;
    const finalAccessSecret = accessSecret || process.env.TWITTER_ACCESS_SECRET;

    if (finalApiKey && finalApiSecret && finalAccessToken && finalAccessSecret) {
      const client = new TwitterApi({
        appKey: finalApiKey,
        appSecret: finalApiSecret,
        accessToken: finalAccessToken,
        accessSecret: finalAccessSecret,
      });
      const res = await client.v2.tweet(tweetText);
      return NextResponse.json({
        success: true,
        message: "Successfully posted to X (Twitter) via API credentials!",
        tweetId: res.data.id,
        pageUrl,
      });
    }

    // If no credentials configured yet, simulate intent or return clear instruction
    return NextResponse.json(
      {
        error: "Twitter / X authentication missing. Please connect your X account using OAuth or enter Twitter API Keys in Admin Settings.",
        shareIntentUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(page.title)}&url=${encodeURIComponent(pageUrl)}`,
        canUseIntent: true,
      },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Twitter posting error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to post to X / Twitter",
        details: error?.data || error
      },
      { status: 500 }
    );
  }
}
