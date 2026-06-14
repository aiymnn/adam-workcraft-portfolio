# Adam Workcraft Production Deployment Guide

This guide covers deployment of the portfolio app using Docker, with app and database separated into independent containers.

## 1) Stack and Runtime

- Framework: Next.js (App Router)
- Runtime: Node.js 20 LTS
- Database: PostgreSQL 16 + Prisma ORM
- Media storage: Google Drive API
- Contact email: SMTP

## 2) Server Prerequisites

Install on your production VM/server:

- Docker Engine 24+
- Docker Compose plugin 2+
- Git

Optional but recommended:

- Reverse proxy (Nginx or Caddy)
- SSL certificate (Let's Encrypt)
- Fail2Ban + firewall rules

Quick verify commands:

```bash
docker --version
docker compose version
git --version
```

## 3) Clone and Prepare Project

```bash
git clone <YOUR_REPOSITORY_URL> adam-workcraft
cd adam-workcraft
```

Create production env file:

```bash
cp .env.example .env.production.local
```

Important:

- Never commit `.env.local` or `.env.production.local`.
- Keep secrets only in your server environment file or secret manager.

## 4) Environment Variables

Use `.env.example` as the source of truth. Fill every required value in `.env.production.local`.

Minimum required groups:

- Database:
  - `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `DATABASE_URL`, `DIRECT_URL`
- Admin auth:
  - `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- App URL:
  - `AUTH_URL`, `NEXT_PUBLIC_SITE_URL`
- Drive:
  - OAuth mode OR service account mode
- SMTP:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_EMAIL`

For Docker Compose in this repo:

- Database host is `db` (service name), not `127.0.0.1`.
- Use:

```env
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@db:5432/<DB_NAME>?schema=public
DIRECT_URL=postgresql://<DB_USER>:<DB_PASSWORD>@db:5432/<DB_NAME>?schema=public
```

## 5) Google Drive Setup (Production)

Choose one auth mode:

1. OAuth mode (`GOOGLE_DRIVE_AUTH_MODE=oauth`)
2. Service account mode (`GOOGLE_DRIVE_AUTH_MODE=service-account`)

Recommended for server deployments: service account mode.

Steps:

1. Create Google Cloud project and enable Google Drive API.
2. Create service account and download JSON credentials.
3. Share target Drive folder with the service account email.
4. Set one of the following in env:
   - `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64` (preferred single variable)
   - OR separate fields (`GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_PROJECT_ID`)
5. Set `GOOGLE_DRIVE_FOLDER_ID`.

Security notes:

- Do not keep `google-service-account.json` inside container image or repo.
- Rotate credentials if leaked.

## 6) Docker Deployment (App + DB Split)

This repo includes:

- `Dockerfile` for the Next.js app
- `docker-compose.production.yml` for `app` + `db`

### First deployment

```bash
docker compose --env-file .env.production.local -f docker-compose.production.yml up -d --build
```

Check status:

```bash
docker compose -f docker-compose.production.yml ps
```

View logs:

```bash
docker compose -f docker-compose.production.yml logs -f app
docker compose -f docker-compose.production.yml logs -f db
```

The app container runs `npm run db:deploy` before startup, so pending Prisma migrations are applied automatically.

## 7) Prisma Migration Workflow

### A) Deploy existing migrations to production

No manual step is required if app starts normally, because container startup runs:

```bash
npm run db:deploy
```

### B) Create a new migration during development

Run locally:

```bash
npm run db:migrate -- --name <your_migration_name>
npm run db:generate
```

Then commit:

- Prisma schema changes
- New migration folder under `prisma/migrations`

Production rollout will apply it automatically at next container restart/redeploy.

### C) If migration fails in production

- Inspect app logs first.
- Fix schema or data issue.
- Redeploy container.
- Avoid editing applied migration files.

## 8) Update/Deploy Procedure (Pull Latest Code)

```bash
git pull origin main
docker compose --env-file .env.production.local -f docker-compose.production.yml up -d --build
```

Recommended zero-surprise sequence:

1. Pull latest code.
2. Confirm env file still contains all required vars.
3. Rebuild and restart containers.
4. Verify health with logs and endpoint checks.

## 9) Backup and Restore

### Backup PostgreSQL

```bash
docker exec -t adam-workcraft-db pg_dump -U $DB_USER -d $DB_NAME > backup.sql
```

### Restore PostgreSQL

```bash
cat backup.sql | docker exec -i adam-workcraft-db psql -U $DB_USER -d $DB_NAME
```

Store backups outside the server and encrypt them.

## 10) Reverse Proxy and SSL

Put Nginx/Caddy in front of container port 3000.

- Proxy to `http://127.0.0.1:3000`
- Enforce HTTPS
- Add security headers
- Limit request body size to expected upload limits

## 11) Monitoring and Operational Checks

Verify after each deployment:

1. Landing page loads and all sections render.
2. Admin login works.
3. Contact form submission creates a message.
4. Admin Messages page can read/unread messages.
5. Google Drive media upload/read works.
6. SMTP message path works.

## 12) Recommended VS Code Extensions (Ops + Dev)

- Prisma (`Prisma.prisma`)
- ESLint (`dbaeumer.vscode-eslint`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- Docker (`ms-azuretools.vscode-docker`)
- GitLens (`eamodio.gitlens`)

## 13) Troubleshooting Notes

- If npm PowerShell policy blocks scripts on Windows, use `npm.cmd`.
- If app cannot connect to DB in Docker, verify host is `db`, not localhost.
- If Drive calls fail with 401/403, re-check folder sharing and auth mode variables.
- If Prisma model mismatch appears, run `npm run db:generate` and redeploy.
