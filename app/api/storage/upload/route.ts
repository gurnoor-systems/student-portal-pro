import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use service_role key first (bypasses RLS), or fallback to anon key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucketName = "course-materials";

  if (!supabaseUrl || !supabaseKey) return null;

  return {
    client: createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    }),
    bucketName
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const fileName = (formData.get("fileName") as string | null) || (file ? file.name : "Document.pdf");
    const courseCode = (formData.get("courseCode") as string | null) || "CS 341";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileKey = `${userId}/${Date.now()}_${sanitizedName}`;
    const versionId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const supabase = getSupabaseClient();

    // If file is attached and Supabase credentials exist
    if (file && supabase) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      const { data, error } = await supabase.client.storage
        .from(supabase.bucketName)
        .upload(fileKey, fileBuffer, {
          contentType: file.type || "application/pdf",
          upsert: true
        });

      if (error) {
        console.error("Supabase storage upload error details:", error);
        return NextResponse.json({
          success: false,
          error: error.message || "Failed to upload to Supabase bucket",
          details: error
        }, { status: 400 });
      }

      // Retrieve public view URL
      const { data: urlData } = supabase.client.storage
        .from(supabase.bucketName)
        .getPublicUrl(fileKey);

      return NextResponse.json({
        success: true,
        fileKey,
        fileUrl: urlData?.publicUrl || "",
        versionId,
        storageProvider: "supabase"
      });
    }

    return NextResponse.json({
      success: true,
      fileKey,
      versionId,
      storageProvider: "simulated"
    });
  } catch (error: any) {
    console.error("Storage upload handler error:", error);
    return NextResponse.json(
      { error: "Upload handler exception", details: error?.message },
      { status: 500 }
    );
  }
}
