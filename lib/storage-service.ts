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
  const cleanUserId = (userId || "guest").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileKey = `${cleanUserId}/${Date.now()}_${sanitizedName}`;

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
    const { data: signedData } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(fileKey, 7200);

    return {
      uploadUrl: `/api/storage/upload`,
      fileKey,
      publicViewUrl: signedData?.signedUrl || "",
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
  storageProvider: "supabase" | "gdrive" | "simulated" = "supabase"
): Promise<StorageViewResponse> {
  const versionId = `v_${Date.now()}`;

  if (storageProvider === "gdrive") {
    const driveViewUrl = `/api/storage/drive-stream?fileId=${encodeURIComponent(fileKey)}`;
    return {
      viewUrl: driveViewUrl,
      versionId,
      storageProvider: "gdrive"
    };
  }

  const supabase = getSupabase();
  if (!supabase || storageProvider === "simulated") {
    return {
      viewUrl: `/api/storage/mock-view?key=${encodeURIComponent(fileKey)}`,
      versionId,
      storageProvider: "simulated"
    };
  }

  try {
    const { data: signedData, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(fileKey, 7200);

    if (signedData?.signedUrl && !error) {
      return {
        viewUrl: signedData.signedUrl,
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
 * Deletes a file from Supabase Storage with strict user ownership validation.
 */
export async function deleteDocumentFromStorage(fileKey: string, userId?: string): Promise<boolean> {
  // IDOR Defense: If file is user-scoped and userId is provided, verify matching ownership prefix
  if (fileKey.includes("/") && userId) {
    const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileOwnerPrefix = fileKey.split("/")[0];
    if (fileOwnerPrefix && fileOwnerPrefix !== cleanUserId && fileOwnerPrefix !== "guest") {
      console.warn(`IDOR Prevention: User ${userId} attempted to delete file belonging to ${fileOwnerPrefix}`);
      return false;
    }
  }

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
