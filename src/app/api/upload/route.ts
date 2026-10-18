/**
 * Media Upload API Handler
 * 
 * Provides unified, CORS-free media uploads to Google Cloud Storage
 * with fail-safe local fallback for offline/development environments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadMediaFile } from '../../../server/cloudStorage';
import { COPY } from '../../../data/copy';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawCategory = formData.get('category') as string | null;
    const category = rawCategory ? rawCategory.replace(/[^a-zA-Z0-9_-]/g, '') : 'photos';

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: COPY.api.upload.noFileProvided },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: COPY.api.upload.invalidFileType },
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

    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanExt = fileExt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'jpg';
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const storagePath = `routines/${category}/${Date.now()}_${cleanName}.${cleanExt}`;

    const result = await uploadMediaFile(buffer, storagePath, file.type);

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
