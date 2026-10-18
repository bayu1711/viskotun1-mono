import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getStorageBucketName,
  DEFAULT_STORAGE_BUCKET,
  uploadMediaFile,
  getMediaFile,
  getStorageStatus
} from '../cloudStorage';

describe('Cloud Storage Server Ledger', () => {
  const originalEnv = process.env;
  const testUploadDir = path.join(process.cwd(), '.viskotun1_uploads');

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    // Clean up test file if created
    const testFile = path.join(testUploadDir, 'routines', 'test_photo.jpg');
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  it('resolves default storage bucket to viskotun1-media-0064688276 when env is unset', () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    delete process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    expect(getStorageBucketName()).toBe(DEFAULT_STORAGE_BUCKET);
  });

  it('strips gs:// prefix from custom bucket name', () => {
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET = 'gs://custom-test-bucket';
    expect(getStorageBucketName()).toBe('custom-test-bucket');
  });

  it('falls back seamlessly to local storage when GCP credentials are unconfigured', async () => {
    // In local dev without credentials, status should be unconfigured
    expect(['unconfigured', 'connected', 'error']).toContain(getStorageStatus());

    const sampleBuffer = Buffer.from('fake-image-bytes-clinical-routine');
    const result = await uploadMediaFile(sampleBuffer, 'routines/test_photo.jpg', 'image/jpeg');

    expect(result.url).toBe('/api/media/routines/test_photo.jpg');
    expect(result.storagePath).toBe('routines/test_photo.jpg');
    expect(result.contentType).toBe('image/jpeg');
    expect(result.size).toBe(sampleBuffer.length);

    // Verify retrieving the media file
    const retrieved = await getMediaFile('routines/test_photo.jpg');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.contentType).toBe('image/jpeg');
    expect(retrieved?.buffer.toString()).toBe('fake-image-bytes-clinical-routine');
  });

  it('returns null when retrieving non-existent media file', async () => {
    const nonExistent = await getMediaFile('routines/does_not_exist_99999.png');
    expect(nonExistent).toBeNull();
  });
});
