/**
 * Media Proxy & Delivery API Handler
 *
 * Streams stored photos without making the bucket public. New uploads live under
 * `users/{uid}/{category}/{random-uuid}.{ext}`, so a URL works as an unguessable link
 * (an <img> tag cannot send an Authorization header). Responses are marked private so
 * shared proxies do not cache them, and they can never run as a document or script.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMediaFile, SERVABLE_IMAGE_TYPES } from '../../../../server/cloudStorage';
import { logError } from '../../../../server/log';

export const dynamic = 'force-dynamic';

const SERVABLE_MIME_TYPES = new Set(Object.values(SERVABLE_IMAGE_TYPES));

const MEDIA_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; sandbox",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer'
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const rawSegments = params?.path;
    if (!rawSegments || !Array.isArray(rawSegments) || rawSegments.length === 0) {
      return new NextResponse('Media path not specified', { status: 400 });
    }

    // Sanitize path against directory traversal
    const safeSegments = rawSegments.map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, ''));
    if (safeSegments.some((segment) => !segment || segment === '.' || segment === '..')) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    const storagePath = safeSegments.join('/');

    const fileData = await getMediaFile(storagePath);
    if (!fileData) {
      return new NextResponse('Media Not Found', { status: 404 });
    }

    // Anything that is not a plain raster image (for example a legacy SVG) is sent as a download
    const isServableImage = SERVABLE_MIME_TYPES.has(fileData.contentType);

    return new NextResponse(new Uint8Array(fileData.buffer), {
      status: 200,
      headers: {
        ...MEDIA_SECURITY_HEADERS,
        'Content-Type': isServableImage ? fileData.contentType : 'application/octet-stream',
        'Content-Disposition': isServableImage ? 'inline' : 'attachment',
        'Cache-Control': 'private, max-age=86400'
      }
    });
  } catch (err: unknown) {
    logError('MediaRoute.GET', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
