import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { google, type drive_v3 } from 'googleapis';

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id?: string;
}

interface UploadOptions {
  fileName?: string;
  folderId?: string;
  mimeType?: string;
  makePublic?: boolean;
}

export interface GoogleDriveUploadResult {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink: string;
}

export interface GoogleDriveFileStreamResult {
  fileName: string;
  mimeType: string;
  size: number | null;
  stream: Readable;
}

const DRIVE_SCOPE = ['https://www.googleapis.com/auth/drive'];
const OAUTH_PLAYGROUND_REDIRECT_URI = 'https://developers.google.com/oauthplayground';

let cachedDriveClient: drive_v3.Drive | null = null;

type DriveAuthMode = 'auto' | 'oauth' | 'service';

function parseServiceAccountJson(rawValue: string): ServiceAccountCredentials {
  const parsed = JSON.parse(rawValue) as ServiceAccountCredentials;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
  }

  parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}

function readServiceAccountCredentials(): ServiceAccountCredentials {
  const serviceAccountJsonBase64 = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (serviceAccountJsonBase64) {
    const decoded = Buffer.from(serviceAccountJsonBase64, 'base64').toString('utf8');
    return parseServiceAccountJson(decoded);
  }

  const serviceAccountJson = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim();
  if (serviceAccountJson) {
    return parseServiceAccountJson(serviceAccountJson);
  }

  const serviceAccountFilePath = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE?.trim();
  if (serviceAccountFilePath) {
    const fileContent = readFileSync(serviceAccountFilePath, 'utf8');
    return parseServiceAccountJson(fileContent);
  }

  const clientEmail =
    process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL?.trim() ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ||
    '';
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

  if (!clientEmail || !privateKey) {
    throw new Error(
      [
        'Google Drive credentials are not configured.',
        'For personal/free My Drive, use OAuth refresh token env vars.',
        'Provide one of the following:',
        '- GOOGLE_DRIVE_OAUTH_CLIENT_ID + GOOGLE_DRIVE_OAUTH_CLIENT_SECRET + GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN',
        '- GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64',
        '- GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON',
        '- GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE (local dev only)',
        '- GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL + GOOGLE_DRIVE_PRIVATE_KEY',
      ].join(' '),
    );
  }

  return {
    client_email: clientEmail,
    private_key: privateKey,
    project_id: process.env.GOOGLE_DRIVE_PROJECT_ID?.trim() || undefined,
  };
}

function getDriveAuthMode(): DriveAuthMode {
  const raw = process.env.GOOGLE_DRIVE_AUTH_MODE?.trim().toLowerCase();
  if (raw === 'oauth') return 'oauth';
  if (raw === 'service') return 'service';
  return 'auto';
}

function hasOAuthCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN?.trim(),
  );
}

function createOAuthDriveClient(): drive_v3.Drive {
  const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET?.trim() || '';
  const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN?.trim() || '';
  const redirectUri =
    process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI?.trim() || OAUTH_PLAYGROUND_REDIRECT_URI;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      [
        'OAuth Drive credentials are incomplete.',
        'Set GOOGLE_DRIVE_OAUTH_CLIENT_ID, GOOGLE_DRIVE_OAUTH_CLIENT_SECRET, and GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN.',
      ].join(' '),
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth });
}

function createServiceAccountDriveClient(): drive_v3.Drive {
  const credentials = readServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: DRIVE_SCOPE,
  });

  return google.drive({ version: 'v3', auth });
}

function getDriveFolderId(folderId?: string): string {
  const resolvedFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || '';
  if (!resolvedFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is required to upload files to Google Drive.');
  }
  return resolvedFolderId;
}

function isPublicByDefault(makePublic?: boolean): boolean {
  if (typeof makePublic === 'boolean') return makePublic;
  return process.env.GOOGLE_DRIVE_PUBLIC_BY_DEFAULT === 'true';
}

function getDriveClient(): drive_v3.Drive {
  if (cachedDriveClient) {
    return cachedDriveClient;
  }

  const mode = getDriveAuthMode();
  if (mode === 'oauth') {
    cachedDriveClient = createOAuthDriveClient();
    return cachedDriveClient;
  }

  if (mode === 'service') {
    cachedDriveClient = createServiceAccountDriveClient();
    return cachedDriveClient;
  }

  // Auto mode prefers OAuth for personal My Drive use-cases.
  cachedDriveClient = hasOAuthCredentials()
    ? createOAuthDriveClient()
    : createServiceAccountDriveClient();

  return cachedDriveClient;
}

export async function uploadFileToGoogleDrive(
  file: File,
  options: UploadOptions = {},
): Promise<GoogleDriveUploadResult> {
  const drive = getDriveClient();
  const folderId = getDriveFolderId(options.folderId);
  const fileName = options.fileName || file.name;
  const mimeType = options.mimeType || file.type || 'application/octet-stream';

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(fileBuffer),
    },
    fields: 'id,name,mimeType,size,webViewLink,webContentLink',
    supportsAllDrives: true,
  });

  if (!response.data.id) {
    throw new Error('Google Drive upload failed: no file id returned.');
  }

  if (isPublicByDefault(options.makePublic)) {
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });
  }

  return {
    id: response.data.id,
    name: response.data.name || fileName,
    mimeType: response.data.mimeType || mimeType,
    size: Number(response.data.size || fileBuffer.length),
    webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
    webContentLink:
      response.data.webContentLink || `https://drive.google.com/uc?export=download&id=${response.data.id}`,
  };
}

export async function getGoogleDriveFileStream(fileId: string): Promise<GoogleDriveFileStreamResult> {
  const drive = getDriveClient();

  const metadataResponse = await drive.files.get({
    fileId,
    fields: 'name,mimeType,size',
    supportsAllDrives: true,
  });

  const mediaResponse = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    { responseType: 'stream' },
  );

  return {
    fileName: metadataResponse.data.name || fileId,
    mimeType: metadataResponse.data.mimeType || 'application/octet-stream',
    size: metadataResponse.data.size ? Number(metadataResponse.data.size) : null,
    stream: mediaResponse.data as Readable,
  };
}

export async function deleteGoogleDriveFile(fileId: string): Promise<void> {
  if (!fileId) return;

  const drive = getDriveClient();
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });
}

export function extractGoogleErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return 'Google Drive request failed';
}
