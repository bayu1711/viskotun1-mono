/**
 * Media Upload API Handler
 *
 * Stores progress photos for signed-in users in Google Cloud Storage. Files are placed
 * under `users/{uid}/...` with a random name, so a media URL cannot be guessed.
 * Guests keep photos on their own device (the widget falls back to a local preview).
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { uploadMediaFile } from '../../../server/cloudStorage';
import { requireUser } from '../../../server/auth';
import { enforceRateLimit } from '../../../server/rateLimit';
import { errorResponse } from '../../../server/http';
import { detectImageType } from '../../../server/imageType';
import { COPY } from '../../../data/copy';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const limited = enforceRateLimit('upload', req, auth);
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const rawCategory = formData.get('category');
    const category =
      (typeof rawCategory === 'string' ? rawCategory.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) : '') || 'photos';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: COPY.api.upload.noFileProvided }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: COPY.api.upload.fileTooLarge }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImageType(buffer);
    if (!detected) {
      return NextResponse.json({ error: COPY.api.upload.invalidFileType }, { status: 400 });
    }

    const storagePath = `users/${auth.uid}/${category}/${randomUUID()}.${detected.ext}`;
    const result = await uploadMediaFile(buffer, storagePath, detected.mime);

    return NextResponse.json({
      success: true,
      url: result.url,
      storagePath: result.storagePath,
      source: result.source,
      contentType: result.contentType,
      size: result.size
    });
  } catch (error) {
    return errorResponse('UploadRoute.POST', error, COPY.api.upload.uploadFailed);
  }
}
