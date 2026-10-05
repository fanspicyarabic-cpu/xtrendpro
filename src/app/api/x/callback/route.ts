import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const savedState = req.cookies.get("twitter_oauth_state")?.value;
    const codeVerifier = req.cookies.get("twitter_oauth_verifier")?.value;

    if (!code || !state || state !== savedState || !codeVerifier) {
      return NextResponse.redirect(
        new URL("/admin?twitter_error=invalid_oauth_state", req.url)
      );
    }

    const clientId = process.env.TWITTER_CLIENT_ID || "";
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const origin = req.headers.get("origin") || req.nextUrl.origin || "http://localhost:3000";
    const callbackUrl = `${origin}/api/x/callback`;

    const client = new TwitterApi({
      clientId: clientId,
      clientSecret: clientSecret,
    });

    const { client: loggedClient, accessToken, refreshToken, expiresIn } =
      await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: callbackUrl,
      });

    // Fetch user details
    const me = await loggedClient.v2.me({
      "user.fields": ["profile_image_url", "verified"],
    });

    const redirectUrl = new URL("/admin", req.url);
    redirectUrl.searchParams.set("twitter_connected", "true");
    redirectUrl.searchParams.set("username", me.data.username);

    const res = NextResponse.redirect(redirectUrl);

    // Save access token securely in HTTP-only cookie
    res.cookies.set("x_user_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn || 7200,
      path: "/",
    });

    res.cookies.set("x_user_info", JSON.stringify({
      id: me.data.id,
      username: me.data.username,
      name: me.data.name,
      profileImageUrl: me.data.profile_image_url,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn || 7200,
      path: "/",
    });

    // Cleanup state cookies
    res.cookies.delete("twitter_oauth_state");
    res.cookies.delete("twitter_oauth_verifier");

    return res;
  } catch (error: any) {
    console.error("Twitter OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/admin?twitter_error=${encodeURIComponent(error.message || "Failed OAuth")}`, req.url)
    );
  }
}
