import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucketName = "course-materials";

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Storage API] Supabase URL or Key is missing from environment variables.");
    return null;
  }

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
    const userId = (formData.get("userId") as string | null) || "student_user";
    const fileName = (formData.get("fileName") as string | null) || (file ? file.name : "Document.pdf");
    const courseCode = (formData.get("courseCode") as string | null) || "CS 341";

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Save directly in root of bucket so it shows up immediately in Supabase files list
    const fileKey = `${Date.now()}_${sanitizedName}`;
    const versionId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const supabase = getSupabaseClient();

    // If a real file is provided and Supabase is configured
    if (file && supabase) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // Auto-Heal: Ensure bucket exists (creates it if missing)
      try {
        const { data: buckets } = await supabase.client.storage.listBuckets();
        const hasBucket = buckets?.some((b: any) => b.name === supabase.bucketName);
        if (!hasBucket) {
          console.log(`[Storage API] Bucket "${supabase.bucketName}" not found. Creating bucket...`);
          await supabase.client.storage.createBucket(supabase.bucketName, { public: true });
        }
      } catch (bucketCheckErr) {
        console.warn("[Storage API] Bucket auto-check notice:", bucketCheckErr);
      }

      // Upload file directly into Supabase Storage
      const { data, error } = await supabase.client.storage
        .from(supabase.bucketName)
        .upload(fileKey, fileBuffer, {
          contentType: file.type || "application/pdf",
          upsert: true
        });

      if (error) {
        console.error("[Storage API] Upload to Supabase failed:", error);
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
    console.error("[Storage API] Global exception:", error);
    return NextResponse.json(
      { error: "Upload exception", details: error?.message },
      { status: 500 }
    );
  }
}
