# PostgreSQL Setup (Prisma + Next.js)

This gives you a Laravel-like migration workflow for this project.

## 1) What You Must Configure Yourself

Set these values in `.env.local`:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DATABASE_URL`

Example:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=adam_workcraft
DB_USER=workcraft
DB_PASSWORD=workcraft_pass

DATABASE_URL=postgresql://workcraft:workcraft_pass@127.0.0.1:5432/adam_workcraft?schema=public
DIRECT_URL=postgresql://workcraft:workcraft_pass@127.0.0.1:5432/adam_workcraft?schema=public
SHADOW_DATABASE_URL=postgresql://workcraft:workcraft_pass@127.0.0.1:5432/adam_workcraft_shadow?schema=public
```

Notes:

- Your DB user must have create/alter table permissions.
- For `prisma migrate dev`, user may also need permission to create a shadow database.
- If your DB is named `adam-workcraft` (with `-`), prefer renaming to `adam_workcraft`.

## 2) Create Database Manually (once)

Use your PostgreSQL client and run:

```sql
CREATE DATABASE adam_workcraft;
CREATE DATABASE adam_workcraft_shadow;
```

If those DBs already exist, skip this step.

## 3) Migration Commands (Laravel-like flow)

These scripts are available in `package.json`:

- `npm run db:generate` -> generate Prisma client
- `npm run db:migrate -- --name init` -> create/apply migration in dev
- `npm run db:deploy` -> apply committed migrations (production style)
- `npm run db:status` -> migration status
- `npm run db:studio` -> open DB UI
- `npm run db:push` -> quick schema sync (not preferred for production)

Recommended flow:

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate -- --name <change_name>`
3. Commit the generated migration files under `prisma/migrations`

## 4) Production-Ready Structure

- Schema source: `prisma/schema.prisma`
- Generated migration files: `prisma/migrations/*`
- Shared DB client: `lib/server/db/client.ts`

Use `db:migrate` in development and `db:deploy` on server/CI.

## 5) Common Errors

- `permission denied to create database`:
  - Grant create DB permission, or create `adam_workcraft_shadow` manually and set `SHADOW_DATABASE_URL`.

- `database does not exist`:
  - Create `adam_workcraft` and verify `DATABASE_URL`.

- `password authentication failed`:
  - Check `DB_USER`, `DB_PASSWORD`, and `DATABASE_URL`.