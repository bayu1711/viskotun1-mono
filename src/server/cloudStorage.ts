/**
 * Google Cloud Storage Service Ledger
 * 
 * Manages media uploads (clinical assessment photos, protocol imagery)
 * using the official Google Cloud Storage SDK (@google-cloud/storage).
 * Automatically authenticates via Application Default Credentials (ADC)
 * on Google Cloud Run, explicit service account credentials, or provides
 * a fail-safe local disk fallback for disconnected local development.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { Storage } from '@google-cloud/storage';

export const DEFAULT_STORAGE_BUCKET = 'viskotun1-media-0064688276';

let storageInstance: Storage | null = null;
let storageStatus: 'unconfigured' | 'connected' | 'error' = 'unconfigured';

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), '.viskotun1_uploads');

/**
 * Detect whether valid Google Cloud credentials or ADC are available.
 * Prevents throwing unhandled ADC exceptions when only project ID is present.
 */
export function hasStorageCredentials(): boolean {
  // 1. Explicit service account JSON file path
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    return true;
  }

  // 2. Raw or base64-encoded service account key in environment
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.GCP_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ) {
    return true;
  }

  // 3. Managed Google Cloud environment (Cloud Run, Cloud Functions, GAE, GCE)
  if (
    process.env.K_SERVICE ||
    process.env.FUNCTION_TARGET ||
    process.env.GAE_ENV ||
    process.env.CLOUD_RUN_JOB
  ) {
    return true;
  }

  // 4. Well-known local Application Default Credentials
  try {
    const defaultAdcPath =
      process.platform === 'win32'
        ? path.join(process.env.APPDATA || '', 'gcloud', 'application_default_credentials.json')
        : path.join(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json');

    if (fs.existsSync(defaultAdcPath)) {
      return true;
    }
  } catch {
    // Filesystem access restricted
  }

  return false;
}

/** Get the configured storage bucket name without gs:// prefix. */
export function getStorageBucketName(): string {
  const raw =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET ||
    DEFAULT_STORAGE_BUCKET;
  return raw.replace(/^gs:\/\//, '').trim();
}

/** Get or initialize the Google Cloud Storage singleton. */
export function getGoogleCloudStorage(): Storage | null {
  if (storageInstance) {
    return storageInstance;
  }

  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    'gen-lang-client-0064688276';

  if (!hasStorageCredentials()) {
    storageStatus = 'unconfigured';
    return null;
  }

  try {
    let credentials: any = undefined;
    const rawCredentials =
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
      process.env.GCP_SERVICE_ACCOUNT_KEY ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (rawCredentials) {
      try {
        const trimmed = rawCredentials.trim();
        const jsonStr = trimmed.startsWith('{')
          ? trimmed
          : Buffer.from(trimmed, 'base64').toString('utf-8');
        credentials = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.warn('[CloudStorage] Could not parse inline service account JSON:', parseErr);
      }
    }

    storageInstance = new Storage({
      projectId,
      credentials: credentials || undefined
    });
    storageStatus = 'connected';
    return storageInstance;
  } catch (err: any) {
    console.warn('[CloudStorage] Cloud Storage initialization error, using local fallback:', err?.message || err);
    storageStatus = 'error';
    storageInstance = null;
    return null;
  }
}

/** Check current storage ledger status. */
export function getStorageStatus(): 'unconfigured' | 'connected' | 'error' {
  if (storageStatus === 'unconfigured' && hasStorageCredentials()) {
    getGoogleCloudStorage();
  }
  return storageStatus;
}

export interface UploadResult {
  url: string;
  storagePath: string;
  source: 'google-cloud-storage' | 'local-fallback';
  contentType: string;
  size: number;
}

/**
 * Upload a media buffer to Google Cloud Storage or local fallback directory.
 */
export async function uploadMediaFile(
  fileBuffer: Buffer,
  storagePath: string,
  contentType: string
): Promise<UploadResult> {
  const cleanPath = storagePath.replace(/^\/+/, '');
  const storage = getGoogleCloudStorage();
  const bucketName = getStorageBucketName();

  if (storage) {
    try {
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(cleanPath);

      await file.save(fileBuffer, {
        metadata: {
          contentType,
          cacheControl: 'public, max-age=31536000, immutable'
        },
        resumable: false
      });

      storageStatus = 'connected';

      return {
        url: `/api/media/${cleanPath}`,
        storagePath: cleanPath,
        source: 'google-cloud-storage',
        contentType,
        size: fileBuffer.length
      };
    } catch (err: any) {
      console.warn(`[CloudStorage] Failed to upload to gs://${bucketName}/${cleanPath}:`, err?.message || err);
    }
  }

  // Fail-safe local filesystem fallback
  try {
    const fullLocalPath = path.join(LOCAL_UPLOADS_DIR, cleanPath);
    const parentDir = path.dirname(fullLocalPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullLocalPath, fileBuffer);

    return {
      url: `/api/media/${cleanPath}`,
      storagePath: cleanPath,
      source: 'local-fallback',
      contentType,
      size: fileBuffer.length
    };
  } catch (localErr) {
    console.error('[CloudStorage] Local filesystem write error:', localErr);
    const base64Data = fileBuffer.toString('base64');
    return {
      url: `data:${contentType};base64,${base64Data}`,
      storagePath: cleanPath,
      source: 'local-fallback',
      contentType,
      size: fileBuffer.length
    };
  }
}

/**
 * Retrieve a media buffer from Google Cloud Storage or local fallback.
 */
export async function getMediaFile(storagePath: string): Promise<{
  buffer: Buffer;
  contentType: string;
} | null> {
  const cleanPath = storagePath.replace(/^\/+/, '');
  const storage = getGoogleCloudStorage();
  const bucketName = getStorageBucketName();

  // 1. Try Google Cloud Storage
  if (storage) {
    try {
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(cleanPath);
      const [exists] = await file.exists();
      if (exists) {
        const [contents] = await file.download();
        const [metadata] = await file.getMetadata();
        return {
          buffer: contents,
          contentType: (metadata.contentType as string) || 'image/jpeg'
        };
      }
    } catch (err: any) {
      console.warn(`[CloudStorage] Read error for gs://${bucketName}/${cleanPath}:`, err?.message || err);
    }
  }

  // 2. Check local filesystem fallback
  const fullLocalPath = path.join(LOCAL_UPLOADS_DIR, cleanPath);
  if (fs.existsSync(fullLocalPath)) {
    try {
      const buffer = fs.readFileSync(fullLocalPath);
      const ext = path.extname(cleanPath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };
      return {
        buffer,
        contentType: mimeTypes[ext] || 'application/octet-stream'
      };
    } catch (readErr) {
      console.error('[CloudStorage] Local file read error:', readErr);
    }
  }

  return null;
}
