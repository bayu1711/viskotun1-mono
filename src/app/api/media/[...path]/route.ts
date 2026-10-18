/**
 * Media Proxy & Delivery API Handler
 * 
 * Securely delivers cloud-stored and local media files with immutable
 * HTTP cache-control headers, preventing cross-origin CORS blocks and
 * eliminating the need for public GCS bucket permissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMediaFile } from '../../../../server/cloudStorage';

export const dynamic = 'force-dynamic';

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
    const safeSegments = rawSegments.map((segment) =>
      segment.replace(/[^a-zA-Z0-9._-]/g, '')
    );
    const storagePath = safeSegments.join('/');

    if (storagePath.includes('..')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const fileData = await getMediaFile(storagePath);
    if (!fileData) {
      return new NextResponse('Media Not Found', { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileData.buffer), {
      status: 200,
      headers: {
        'Content-Type': fileData.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (err: any) {
    console.error('[API /api/media] Error fetching media file:', err?.message || err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
