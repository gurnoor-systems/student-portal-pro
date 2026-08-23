import { createClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = "course-materials";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface StorageUploadResponse {
  uploadUrl?: string;
  fileKey: string;
  publicViewUrl?: string;
  versionId: string;
  storageProvider: "supabase" | "gdrive" | "simulated";
}

export interface StorageViewResponse {
  viewUrl: string;
  versionId: string;
  storageProvider: "supabase" | "gdrive" | "simulated";
}

/**
 * Creates an upload destination for Supabase Storage.
 */
export async function createUploadDestination(
  userId: string,
  fileName: string,
  contentType: string = "application/pdf"
): Promise<StorageUploadResponse> {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const versionId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fileKey = `${userId}/${Date.now()}_${sanitizedName}`;

  const supabase = getSupabase();
  if (!supabase) {
    return {
      uploadUrl: `/api/storage/upload`,
      fileKey,
      versionId,
      storageProvider: "simulated"
    };
  }

  try {
    const { data: pubData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileKey);

    return {
      uploadUrl: `/api/storage/upload`,
      fileKey,
      publicViewUrl: pubData?.publicUrl || "",
      versionId,
      storageProvider: "supabase"
    };
  } catch {
    return {
      fileKey,
      versionId,
      storageProvider: "simulated"
    };
  }
}

/**
 * Creates a signed view URL for Supabase Storage or Google Drive fileId.
 */
export async function createDocumentViewUrl(
  fileKey: string,
  versionId: string = "v1",
  googleDriveFileId?: string
): Promise<StorageViewResponse> {
  if (googleDriveFileId) {
    return {
      viewUrl: `/api/storage/drive-stream?fileId=${encodeURIComponent(googleDriveFileId)}`,
      versionId,
      storageProvider: "gdrive"
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      viewUrl: `/api/storage/mock-view?key=${encodeURIComponent(fileKey)}`,
      versionId,
      storageProvider: "simulated"
    };
  }

  try {
    const { data: pubData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileKey);

    if (pubData?.publicUrl) {
      return {
        viewUrl: pubData.publicUrl,
        versionId,
        storageProvider: "supabase"
      };
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(fileKey, 3600);

    if (data?.signedUrl) {
      return {
        viewUrl: data.signedUrl,
        versionId,
        storageProvider: "supabase"
      };
    }

    return {
      viewUrl: `/api/storage/mock-view?key=${encodeURIComponent(fileKey)}`,
      versionId,
      storageProvider: "simulated"
    };
  } catch {
    return {
      viewUrl: `/api/storage/mock-view?key=${encodeURIComponent(fileKey)}`,
      versionId,
      storageProvider: "simulated"
    };
  }
}

/**
 * Deletes a file from Supabase Storage.
 */
export async function deleteDocumentFromStorage(fileKey: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileKey]);

    return !error;
  } catch {
    return false;
  }
}
