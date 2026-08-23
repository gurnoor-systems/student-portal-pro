import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const diagnostics: Record<string, any> = {
    hasUrl: !!url,
    urlValue: url ? `${url.substring(0, 15)}...` : null,
    hasAnonKey: !!anonKey,
    hasServiceKey: !!serviceKey,
    bucketName: "course-materials",
  };

  if (!url || (!serviceKey && !anonKey)) {
    return NextResponse.json({
      success: false,
      message: "Missing Supabase Environment Variables in Vercel",
      diagnostics
    }, { status: 500 });
  }

  try {
    const client = createClient(url, serviceKey || anonKey!, {
      auth: { persistSession: false }
    });

    // 1. List buckets
    const { data: buckets, error: bucketError } = await client.storage.listBuckets();
    diagnostics.buckets = buckets?.map(b => b.name) || [];
    diagnostics.bucketError = bucketError?.message || null;

    // 2. Ensure bucket exists
    const hasCourseBucket = buckets?.some(b => b.name === "course-materials");
    if (!hasCourseBucket) {
      const { data: newBucket, error: createError } = await client.storage.createBucket("course-materials", { public: true });
      diagnostics.bucketAutoCreated = !createError;
      diagnostics.bucketCreateError = createError?.message || null;
    } else {
      diagnostics.bucketExists = true;
    }

    // 3. Test writing a lightweight diagnostic file
    const testKey = `test_sync_${Date.now()}.txt`;
    const { data: uploadData, error: uploadError } = await client.storage
      .from("course-materials")
      .upload(testKey, Buffer.from("Student Portal Pro Connection OK"), {
        contentType: "text/plain",
        upsert: true
      });

    diagnostics.testUploadSuccess = !uploadError;
    diagnostics.testUploadError = uploadError?.message || null;

    // 4. Clean up test file
    if (!uploadError) {
      await client.storage.from("course-materials").remove([testKey]);
      diagnostics.testCleanupSuccess = true;
    }

    return NextResponse.json({
      success: !uploadError,
      message: uploadError ? `Supabase rejected upload: ${uploadError.message}` : "Supabase Storage connected & verified successfully!",
      diagnostics
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Exception connecting to Supabase",
      error: error?.message,
      diagnostics
    }, { status: 500 });
  }
}
