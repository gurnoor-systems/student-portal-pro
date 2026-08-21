import { NextRequest, NextResponse } from "next/server";
import { deleteDocumentFromStorage } from "@/lib/storage-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileKey } = body;

    if (!fileKey) {
      return NextResponse.json(
        { error: "Missing required field: fileKey" },
        { status: 400 }
      );
    }

    const isDeleted = await deleteDocumentFromStorage(fileKey);

    return NextResponse.json({
      success: isDeleted,
      message: isDeleted ? "File deleted from storage" : "Failed to delete"
    });
  } catch (error: any) {
    console.error("Storage deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete file from storage", details: error?.message },
      { status: 500 }
    );
  }
}
