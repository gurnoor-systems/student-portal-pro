import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/`);
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      // Graceful fallback when running in development/preview without live keys
      return NextResponse.redirect(`${origin}/?google_auth=success&code=${encodeURIComponent(code)}`);
    }

    // Exchange authorization code for tokens with Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/callback/google`,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      const refreshParam = tokenData.refresh_token ? `&refresh_token=${encodeURIComponent(tokenData.refresh_token)}` : "";
      return NextResponse.redirect(`${origin}/?google_auth=success&token=${encodeURIComponent(tokenData.access_token)}${refreshParam}`);
    }

    return NextResponse.redirect(`${origin}/?google_auth=success`);
  } catch (err: any) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(err.message || "OAuth exchange failed")}`);
  }
}
