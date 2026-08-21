import { NextRequest, NextResponse } from "next/server";
import { createDocumentViewUrl } from "@/lib/storage-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileKey, versionId, googleDriveFileId } = body;

    if (!fileKey && !googleDriveFileId) {
      return NextResponse.json(
        { error: "Missing required field: fileKey or googleDriveFileId" },
        { status: 400 }
      );
    }

    const viewData = await createDocumentViewUrl(
      fileKey || "",
      versionId || "v1",
      googleDriveFileId
    );

    return NextResponse.json({
      success: true,
      ...viewData
    });
  } catch (error: any) {
    console.error("View URL generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate view URL", details: error?.message },
      { status: 500 }
    );
  }
}
