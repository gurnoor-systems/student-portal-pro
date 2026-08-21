import { NextRequest, NextResponse } from "next/server";
import { createUploadDestination } from "@/lib/storage-service";

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

    const MAX_FILE_SIZE = 60 * 1024 * 1024;
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 60MB limit" },
        { status: 413 }
      );
    }

    const uploadData = await createUploadDestination(
      userId,
      fileName,
      contentType || "application/pdf"
    );

    return NextResponse.json({
      success: true,
      ...uploadData
    });
  } catch (error: any) {
    console.error("Upload destination creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create upload destination", details: error?.message },
      { status: 500 }
    );
  }
}
