import { Readable } from 'node:stream';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import {
  deleteGoogleDriveFile,
  extractGoogleErrorMessage,
  getGoogleDriveFileStream,
} from '@/lib/server/google-drive';

export const runtime = 'nodejs';

function toAsciiFileName(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '_');
}

function shouldRequireAdminForFetch(): boolean {
  return process.env.GOOGLE_DRIVE_REQUIRE_ADMIN_FOR_FETCH === 'true';
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> },
) {
  if (shouldRequireAdminForFetch()) {
    const authenticated = await isAdminRequestAuthenticated(request);
    if (!authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const { fileId } = await context.params;
    if (!fileId) {
      return NextResponse.json({ success: false, message: 'File id is required' }, { status: 400 });
    }

    const file = await getGoogleDriveFileStream(fileId);
    const isDownload = request.nextUrl.searchParams.get('download') === '1';
    const encodedFileName = encodeURIComponent(file.fileName);
    const asciiFileName = toAsciiFileName(file.fileName);
    const dispositionType = isDownload ? 'attachment' : 'inline';

    const headers = new Headers();
    headers.set('Content-Type', file.mimeType || 'application/octet-stream');
    headers.set(
      'Content-Disposition',
      `${dispositionType}; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`,
    );

    if (file.size !== null) {
      headers.set('Content-Length', String(file.size));
    }

    if (shouldRequireAdminForFetch()) {
      headers.set('Cache-Control', 'private, no-store');
    } else {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    const webStream = Readable.toWeb(file.stream) as ReadableStream;
    return new NextResponse(webStream, { status: 200, headers });
  } catch (error) {
    const message = extractGoogleErrorMessage(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> },
) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileId } = await context.params;
    if (!fileId) {
      return NextResponse.json({ success: false, message: 'File id is required' }, { status: 400 });
    }

    await deleteGoogleDriveFile(fileId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = extractGoogleErrorMessage(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
