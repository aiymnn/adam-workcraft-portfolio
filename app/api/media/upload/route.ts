import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import {
  deleteGoogleDriveFile,
  extractGoogleErrorMessage,
  uploadFileToGoogleDrive,
} from '@/lib/server/google-drive';

export const runtime = 'nodejs';

const DEFAULT_MAX_UPLOAD_MB = 20;

function sanitizeFileName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
}

function getMaxUploadBytes(): number {
  const envMaxUploadMb = Number(process.env.GOOGLE_DRIVE_MAX_UPLOAD_MB || DEFAULT_MAX_UPLOAD_MB);
  if (!Number.isFinite(envMaxUploadMb) || envMaxUploadMb <= 0) {
    return DEFAULT_MAX_UPLOAD_MB * 1024 * 1024;
  }
  return Math.floor(envMaxUploadMb * 1024 * 1024);
}

export async function POST(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const filePart = formData.get('file');

    if (!(filePart instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'A file field is required (multipart/form-data, key: file).' },
        { status: 400 },
      );
    }

    const maxUploadBytes = getMaxUploadBytes();
    if (filePart.size > maxUploadBytes) {
      return NextResponse.json(
        {
          success: false,
          message: `File exceeds upload limit of ${Math.floor(maxUploadBytes / (1024 * 1024))}MB.`,
        },
        { status: 413 },
      );
    }

    const makePublicRaw = formData.get('makePublic');
    const makePublic = typeof makePublicRaw === 'string' && ['true', '1', 'yes'].includes(makePublicRaw.toLowerCase());
    const previousFileIdRaw = formData.get('previousFileId');
    const previousFileId = typeof previousFileIdRaw === 'string' ? previousFileIdRaw.trim() : '';
    const fileNameRaw = formData.get('fileName');
    const fileName = typeof fileNameRaw === 'string' ? sanitizeFileName(fileNameRaw) : '';

    const uploaded = await uploadFileToGoogleDrive(filePart, {
      makePublic,
      fileName: fileName || undefined,
    });

    let previousFileDeleted = false;
    if (previousFileId && previousFileId !== uploaded.id) {
      try {
        await deleteGoogleDriveFile(previousFileId);
        previousFileDeleted = true;
      } catch {
        // Ignore cleanup failure so successful upload is not blocked.
      }
    }

    return NextResponse.json(
      {
        success: true,
        previousFileDeleted,
        file: {
          id: uploaded.id,
          name: uploaded.name,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
          driveViewUrl: uploaded.webViewLink,
          driveDownloadUrl: uploaded.webContentLink,
          proxyUrl: `/api/media/${uploaded.id}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = extractGoogleErrorMessage(error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
