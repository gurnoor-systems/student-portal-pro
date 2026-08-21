import { NextRequest, NextResponse } from "next/server";
import { createPresignedUploadUrl } from "@/lib/storage-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, fileName, fileSize, contentType } = body;

    if (!userId || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields: userId and fileName" },
        { status: 400 }
      );
    }

    // Safety limit: 60 MB maximum per file to prevent abuse on free tier
    const MAX_FILE_SIZE = 60 * 1024 * 1024;
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 60MB limit for textbooks/documents" },
        { status: 413 }
      );
    }

    const presignedData = await createPresignedUploadUrl(
      userId,
      fileName,
      contentType || "application/pdf"
    );

    return NextResponse.json({
      success: true,
      ...presignedData
    });
  } catch (error: any) {
    console.error("Presigned upload generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate pre-signed upload ticket", details: error?.message },
      { status: 500 }
    );
  }
}
