import { NextRequest, NextResponse } from "next/server";
import { deleteDocumentFromStorage } from "@/lib/storage-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileKey, userId } = body;

    if (!fileKey) {
      return NextResponse.json(
        { error: "Missing required field: fileKey" },
        { status: 400 }
      );
    }

    // IDOR Protection: Verify file ownership if userId or user scoping is provided
    if (fileKey.includes("/") && userId) {
      const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileOwnerId = fileKey.split("/")[0];
      if (fileOwnerId && fileOwnerId !== cleanUserId && fileOwnerId !== "guest") {
        return NextResponse.json(
          { error: "Access Denied: You do not have permission to delete this file." },
          { status: 403 }
        );
      }
    }

    const isDeleted = await deleteDocumentFromStorage(fileKey, userId);

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
