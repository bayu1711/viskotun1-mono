/**
 * Media Upload API Handler
 * 
 * Provides unified, CORS-free media uploads to Google Cloud Storage
 * with fail-safe local fallback for offline/development environments.
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { uploadMediaFile } from '../../../server/cloudStorage';
import { detectImageType } from '../../../server/imageType';
import { enforceRateLimit } from '../../../server/rateLimit';
import { COPY } from '../../../data/copy';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit('upload', req);
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawCategory = formData.get('category') as string | null;
    const category =
      (typeof rawCategory === 'string' ? rawCategory.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) : '') || 'photos';

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: COPY.api.upload.noFileProvided },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: COPY.api.upload.fileTooLarge },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detected = detectImageType(buffer);
    if (!detected) {
      return NextResponse.json(
        { error: COPY.api.upload.invalidFileType },
        { status: 400 }
      );
    }

    const storagePath = `routines/${category}/${randomUUID()}.${detected.ext}`;
    const result = await uploadMediaFile(buffer, storagePath, detected.mime);

    return NextResponse.json({
      success: true,
      url: result.url,
      storagePath: result.storagePath,
      source: result.source,
      contentType: result.contentType,
      size: result.size
    });
  } catch (error: any) {
    console.error('[API /api/upload] Error processing upload:', error?.message || error);
    return NextResponse.json(
      { error: COPY.api.upload.uploadFailed },
      { status: 500 }
    );
  }
}
