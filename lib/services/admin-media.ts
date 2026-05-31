interface UploadResponse {
  success?: boolean;
  message?: string;
  file?: {
    proxyUrl?: string;
    driveViewUrl?: string;
  };
}

interface UploadAdminMediaOptions {
  previousFileId?: string;
  fileName?: string;
}

function parseJsonSafe<T>(value: unknown): T | null {
  if (typeof value !== 'object' || value === null) return null;
  return value as T;
}

export function extractMediaFileId(url: string): string | null {
  if (!url) return null;

  const match = url.match(/\/api\/media\/([^/?#]+)/i);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

export async function deleteAdminMediaByUrl(url: string): Promise<void> {
  const fileId = extractMediaFileId(url);
  if (!fileId) return;

  const response = await fetch(`/api/media/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const payloadRaw = await response.json().catch(() => null);
    const payload = parseJsonSafe<UploadResponse>(payloadRaw);
    throw new Error(payload?.message || 'Failed to delete media');
  }
}

export async function uploadAdminMedia(file: File, options: UploadAdminMediaOptions = {}): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  if (options.previousFileId) {
    body.append('previousFileId', options.previousFileId);
  }
  if (options.fileName) {
    body.append('fileName', options.fileName);
  }

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    credentials: 'same-origin',
    body,
  });

  const payloadRaw = await response.json().catch(() => null);
  const payload = parseJsonSafe<UploadResponse>(payloadRaw);

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Failed to upload media');
  }

  const url = payload.file?.proxyUrl || payload.file?.driveViewUrl;
  if (!url) {
    throw new Error('Upload finished without media URL');
  }

  return url;
}
