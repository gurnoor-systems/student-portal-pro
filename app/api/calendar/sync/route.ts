import { NextResponse } from "next/server";

async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token"
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data.access_token || null;
    }
  } catch {}
  return null;
}

// Google Calendar API v3 Proxy & Synchronizer Route with Auto-Refresh
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let accessToken = request.headers.get("Authorization")?.replace("Bearer ", "") || searchParams.get("accessToken");
  const refreshToken = request.headers.get("x-refresh-token") || searchParams.get("refreshToken") || "";

  if (!accessToken && !refreshToken) {
    return NextResponse.json({
      success: false,
      message: "No Google OAuth access token provided. Google Calendar connection is optional."
    }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    let googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&singleEvents=true&orderBy=startTime&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    let newAccessToken: string | null = null;

    // Auto-refresh expired token seamlessly
    if (googleRes.status === 401 && refreshToken) {
      newAccessToken = await refreshGoogleAccessToken(refreshToken);
      if (newAccessToken) {
        accessToken = newAccessToken;
        googleRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&singleEvents=true&orderBy=startTime&maxResults=50`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json"
            }
          }
        );
      }
    }

    if (!googleRes.ok) {
      const errData = await googleRes.json().catch(() => ({}));
      if (googleRes.status === 401) {
        return NextResponse.json({ 
          success: false, 
          tokenExpired: true, 
          message: "Google Calendar access expired. Please reconnect your account." 
        }, { status: 200 });
      }
      return NextResponse.json({ success: false, error: errData }, { status: googleRes.status });
    }

    const data = await googleRes.json();
    return NextResponse.json({
      success: true,
      events: data.items || [],
      newAccessToken
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { accessToken, refreshToken, title, description, startTime, endTime, location } = body;

    if (!accessToken && !refreshToken) {
      return NextResponse.json({
        success: false,
        message: "Google Calendar connection is optional. Task saved locally."
      }, { status: 200 });
    }

    const eventPayload = {
      summary: title,
      description: description || "Scheduled via Student Portal Pro",
      location: location || "",
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: "UTC"
      },
      end: {
        dateTime: new Date(endTime || new Date(startTime).getTime() + 3600000).toISOString(),
        timeZone: "UTC"
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 30 },
          { method: "email", minutes: 1440 }
        ]
      }
    };

    let googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(eventPayload)
      }
    );

    let newAccessToken: string | null = null;

    if (googleRes.status === 401 && refreshToken) {
      newAccessToken = await refreshGoogleAccessToken(refreshToken);
      if (newAccessToken) {
        accessToken = newAccessToken;
        googleRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify(eventPayload)
          }
        );
      }
    }

    if (!googleRes.ok) {
      const errData = await googleRes.json().catch(() => ({}));
      if (googleRes.status === 401) {
        return NextResponse.json({ 
          success: false, 
          tokenExpired: true, 
          message: "Google Calendar session expired. Task saved locally." 
        }, { status: 200 });
      }
      return NextResponse.json({ success: false, error: errData }, { status: googleRes.status });
    }

    const data = await googleRes.json();
    return NextResponse.json({ success: googleRes.ok, googleEvent: data, newAccessToken });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!accessToken || !eventId) {
      return NextResponse.json({ success: true, message: "Local delete completed." });
    }

    const googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return NextResponse.json({ success: googleRes.ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
