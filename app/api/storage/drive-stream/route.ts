import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    const accessToken = req.headers.get("Authorization")?.replace("Bearer ", "") || 
                       searchParams.get("token") || 
                       process.env.GOOGLE_DRIVE_SERVICE_TOKEN;

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId parameter" }, { status: 400 });
    }

    // Google Drive direct export / binary stream URL
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const driveRes = await fetch(driveUrl, { headers });

    if (!driveRes.ok) {
      // Fallback: If no token or public link, try Google Drive public export
      const fallbackUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
      const fallbackRes = await fetch(fallbackUrl);

      if (fallbackRes.ok && fallbackRes.body) {
        return new NextResponse(fallbackRes.body, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline",
            "Cache-Control": "public, max-age=3600"
          }
        });
      }

      return NextResponse.json(
        { error: "Failed to stream document from Google Drive" },
        { status: driveRes.status }
      );
    }

    if (!driveRes.body) {
      return NextResponse.json({ error: "No content received from Google Drive" }, { status: 502 });
    }

    return new NextResponse(driveRes.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error: any) {
    console.error("Google Drive stream error:", error);
    return NextResponse.json(
      { error: "Error streaming from Google Drive", details: error?.message },
      { status: 500 }
    );
  }
}
