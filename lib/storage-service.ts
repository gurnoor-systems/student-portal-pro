import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 / S3 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "student-portal-storage";

// Initialize S3 client for Cloudflare R2 if credentials exist
let s3Client: S3Client | null = null;

if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileKey: string;
  publicViewUrl?: string;
  isSimulated: boolean;
  versionId: string;
}

export interface PresignedViewResponse {
  viewUrl: string;
  versionId: string;
  isSimulated: boolean;
}

/**
 * Generates a direct Pre-Signed Upload URL (bypassing Vercel 4.5MB payload limit).
 * Browser uploads directly to Cloudflare R2 bucket.
 */
export async function createPresignedUploadUrl(
  userId: string,
  fileName: string,
  contentType: string = "application/pdf"
): Promise<PresignedUploadResponse> {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const versionId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fileKey = `users/${userId}/documents/${Date.now()}_${sanitizedName}`;

  if (!s3Client) {
    // Cloudflare R2 credentials not configured yet -> Graceful fallback
    return {
      uploadUrl: `/api/storage/mock-upload?key=${encodeURIComponent(fileKey)}`,
      fileKey,
      isSimulated: true,
      versionId
    };
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
    Metadata: {
      uploadedBy: userId,
      versionId,
      originalName: encodeURIComponent(fileName)
    }
  });

  // 10-minute temporary upload token
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

  return {
    uploadUrl,
    fileKey,
    isSimulated: false,
    versionId
  };
}

/**
 * Generates a time-limited (15-minute) Pre-Signed View URL for private reading.
 */
export async function createPresignedViewUrl(
  fileKey: string,
  versionId: string = "v1"
): Promise<PresignedViewResponse> {
  if (!s3Client) {
    return {
      viewUrl: `/api/storage/mock-view?key=${encodeURIComponent(fileKey)}`,
      versionId,
      isSimulated: true
    };
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
  });

  // 15-minute temporary read token
  const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return {
    viewUrl,
    versionId,
    isSimulated: false
  };
}

/**
 * Deletes a file binary from Cloudflare R2 to reclaim storage space on the 10GB free tier.
 */
export async function deleteFileFromCloud(fileKey: string): Promise<boolean> {
  if (!s3Client) {
    return true;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("Failed to delete object from Cloudflare R2:", error);
    return false;
  }
}
