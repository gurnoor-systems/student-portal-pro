import { NextRequest, NextResponse } from "next/server";
import { createPresignedViewUrl } from "@/lib/storage-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileKey, versionId } = body;

    if (!fileKey) {
      return NextResponse.json(
        { error: "Missing required field: fileKey" },
        { status: 400 }
      );
    }

    const viewData = await createPresignedViewUrl(fileKey, versionId || "v1");

    return NextResponse.json({
      success: true,
      ...viewData
    });
  } catch (error: any) {
    console.error("Presigned view generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate pre-signed view ticket", details: error?.message },
      { status: 500 }
    );
  }
}
