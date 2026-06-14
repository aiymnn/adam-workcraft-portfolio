# Google Drive Production Setup

This project now includes Google Drive endpoints:

- `POST /api/media/upload` (admin-auth protected)
- `GET /api/media/[fileId]` (public by default, configurable)

## 1. Google Cloud / Drive preparation

1. Create or select your Google Cloud project (`image-gallery-497516`).
2. Enable Google Drive API.
3. Use your existing service account:
   - `aizz-devop@image-gallery-497516.iam.gserviceaccount.com`
4. In Google Drive, open your folder (`image-gallery`) and share it with the service account email as **Editor**.
5. Copy the folder ID from Drive URL:
   - `https://drive.google.com/drive/folders/<FOLDER_ID>`

## 2. Environment variables (production-safe)

Use one credential strategy only.

### Strategy O (personal/free My Drive): OAuth refresh token

Use this when you do not have Shared Drive access (for example personal Gmail).

Set:

- `GOOGLE_DRIVE_AUTH_MODE=oauth`
- `GOOGLE_DRIVE_FOLDER_ID=<my-drive-folder-id>`
- `GOOGLE_DRIVE_OAUTH_CLIENT_ID=<oauth-client-id>`
- `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET=<oauth-client-secret>`
- `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=<refresh-token>`

Quick way to get refresh token:

1. Create OAuth Client ID in Google Cloud Console (Desktop app or Web app).
2. Open OAuth 2.0 Playground.
3. In settings, enable "Use your own OAuth credentials" and paste client id/secret.
4. Authorize scope: `https://www.googleapis.com/auth/drive`.
5. Exchange code and copy `refresh_token`.

Optional:

- `GOOGLE_DRIVE_OAUTH_REDIRECT_URI=https://developers.google.com/oauthplayground`

### Strategy A (recommended for production): base64 JSON key

Set these secrets in your production platform:

- `GOOGLE_DRIVE_FOLDER_ID=<folder-id>`
- `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64=<base64-encoded-service-account-json>`

Generate base64 locally (PowerShell):

```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("google-service-account.json"))
```

### Strategy B: raw JSON as secret

- `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON={...full json...}`
- `GOOGLE_DRIVE_FOLDER_ID=<folder-id>`

### Strategy C (local development only): JSON file path

- `GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE=./google-service-account.json`
- `GOOGLE_DRIVE_FOLDER_ID=<folder-id>`

## 3. Optional behavior flags

- `GOOGLE_DRIVE_MAX_UPLOAD_MB=20`
- `GOOGLE_DRIVE_PUBLIC_BY_DEFAULT=false`
- `GOOGLE_DRIVE_REQUIRE_ADMIN_FOR_FETCH=false`

## 4. Upload API usage

Request (`multipart/form-data`):

- key `file`: binary file
- optional key `makePublic`: `true` or `false`

Response contains:

- Drive file id
- direct Drive URLs
- app proxy URL (`/api/media/<fileId>`)

## 5. Production checklist

1. Add env vars in deployment secrets (do not commit JSON key file).
2. Redeploy app.
3. Login as admin.
4. Test upload endpoint.
5. Open returned proxy URL and confirm file loads.
6. If you want private files only, set `GOOGLE_DRIVE_REQUIRE_ADMIN_FOR_FETCH=true`.
