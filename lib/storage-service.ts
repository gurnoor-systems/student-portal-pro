import { createClient } from "@supabase/supabase-js";

// Supabase Storage Configuration (100% Free / NO Credit Card Required)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STORAGE_BUCKET = "course-materials";

let supabaseClient: any = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
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
 * Creates a pre-signed or direct upload destination on Supabase Storage (1GB Free, 0 Card).
 */
export async function createUploadDestination(
  userId: string,
  fileName: string,
  contentType: string = "application/pdf"
): Promise<StorageUploadResponse> {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const versionId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fileKey = `${userId}/${Date.now()}_${sanitizedName}`;

  if (!supabaseClient) {
    // Zero-config simulated mode if Supabase keys not entered yet
    return {
      uploadUrl: `/api/storage/mock-upload?key=${encodeURIComponent(fileKey)}`,
      fileKey,
      versionId,
      storageProvider: "simulated"
    };
  }

  try {
    // Generate signed upload URL in Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(fileKey);

    if (error || !data?.signedUrl) {
      // If bucket is public or standard upload
      const { data: publicData } = supabaseClient.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileKey);

      return {
        uploadUrl: publicData.publicUrl,
        fileKey,
        publicViewUrl: publicData.publicUrl,
        versionId,
        storageProvider: "supabase"
      };
    }

    return {
      uploadUrl: data.signedUrl,
      fileKey,
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
  // If Google Drive fileId is provided, route through direct stream proxy
  if (googleDriveFileId) {
    return {
      viewUrl: `/api/storage/drive-stream?fileId=${encodeURIComponent(googleDriveFileId)}`,
      versionId,
      storageProvider: "gdrive"
    };
  }

  if (!supabaseClient) {
    return {
      viewUrl: `/api/storage/mock-view?key=${encodeURIComponent(fileKey)}`,
      versionId,
      storageProvider: "simulated"
    };
  }

  try {
    // Request a 1-hour signed read URL from Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(fileKey, 3600);

    if (error || !data?.signedUrl) {
      const { data: pubData } = supabaseClient.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileKey);

      return {
        viewUrl: pubData.publicUrl,
        versionId,
        storageProvider: "supabase"
      };
    }

    return {
      viewUrl: data.signedUrl,
      versionId,
      storageProvider: "supabase"
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
 * Deletes a file from Supabase Storage to reclaim the free 1GB space.
 */
export async function deleteDocumentFromStorage(fileKey: string): Promise<boolean> {
  if (!supabaseClient) return true;

  try {
    const { error } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .remove([fileKey]);

    return !error;
  } catch {
    return false;
  }
}
