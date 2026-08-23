import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STORAGE_BUCKET = "course-materials";

let supabaseClient: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const fileName = (formData.get("fileName") as string | null) || (file ? file.name : "Document.pdf");
    const courseCode = formData.get("courseCode") as string || "CS 341";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileKey = `${userId}/${Date.now()}_${sanitizedName}`;
    const versionId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // If a real file was uploaded and Supabase is configured
    if (file && supabaseClient) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // Upload directly to Supabase Storage bucket
      const { data, error } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .upload(fileKey, fileBuffer, {
          contentType: file.type || "application/pdf",
          upsert: true
        });

      if (error) {
        console.error("Supabase Storage upload error:", error);
      } else {
        // Get public URL
        const { data: urlData } = supabaseClient.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(fileKey);

        return NextResponse.json({
          success: true,
          fileKey,
          fileUrl: urlData?.publicUrl || "",
          versionId,
          storageProvider: "supabase"
        });
      }
    }

    // Fallback: Return fileKey and version for local/simulated storage
    return NextResponse.json({
      success: true,
      fileKey,
      versionId,
      storageProvider: "simulated"
    });
  } catch (error: any) {
    console.error("Storage upload handler exception:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error?.message },
      { status: 500 }
    );
  }
}
