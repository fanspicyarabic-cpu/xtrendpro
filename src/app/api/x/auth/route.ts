import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.TWITTER_CLIENT_ID || "TWITTER_CLIENT_ID_PLACEHOLDER";
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const origin = req.headers.get("origin") || req.nextUrl.origin || "http://localhost:3000";
    const callbackUrl = `${origin}/api/x/callback`;

    if (!process.env.TWITTER_CLIENT_ID) {
      // Return a helper response if client ID is not configured
      return NextResponse.json({
        configured: false,
        message: "Twitter Client ID not set in environment variables. You can also use direct API keys in Admin Settings.",
        callbackUrl,
      });
    }

    const client = new TwitterApi({
      clientId: clientId,
      clientSecret: clientSecret,
    });

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      callbackUrl,
      {
        scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      }
    );

    const response = NextResponse.redirect(url);
    // Store codeVerifier and state in cookies
    response.cookies.set("twitter_oauth_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });
    response.cookies.set("twitter_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Twitter OAuth start error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
