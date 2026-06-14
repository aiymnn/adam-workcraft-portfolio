# Backend Architecture Plan (Next.js + Dedicated Backend Readiness)

## Goals
- Keep App Router pages thin and UI-focused.
- Move business logic and data access into server modules.
- Centralize auth, validation, and error handling.
- Support future extraction to a separate backend service with minimal refactor.

## Proposed Structure

```text
app/
  api/
    v1/
      auth/
        login/route.ts
        logout/route.ts
        session/route.ts
      admin/
        bookings/route.ts
        profile/route.ts
        reviews/route.ts
        social-links/route.ts
        site-content/route.ts
        vault/route.ts
      public/
        about/route.ts
        bookings/route.ts
        contact/route.ts
        profile/route.ts
        reviews/route.ts
        social-links/route.ts
        vault/route.ts
      media/
        upload/route.ts
        [fileId]/route.ts

src/
  server/
    auth/
      session.ts
      permissions.ts
      password.ts
    db/
      client.ts
      repositories/
        booking.repository.ts
        review.repository.ts
        vault.repository.ts
        social.repository.ts
        profile.repository.ts
        content.repository.ts
    services/
      booking.service.ts
      review.service.ts
      vault.service.ts
      social.service.ts
      profile.service.ts
      content.service.ts
      media.service.ts
    validation/
      auth.schema.ts
      booking.schema.ts
      review.schema.ts
      vault.schema.ts
      social.schema.ts
      profile.schema.ts
      content.schema.ts
      media.schema.ts
    http/
      api-response.ts
      errors.ts
      with-auth.ts
      with-error-boundary.ts

db/
  schema/
    001_init.sql
    002_reviews.sql
    003_vault.sql
```

## Current -> Target Mapping

- `lib/services/auth.ts`
  - Move credential/session logic into `src/server/auth/*`.
  - Keep only client helpers for reading auth state from API if needed.

- `lib/services/bookings.ts`
  - Replace localStorage access with API client calls to `/api/v1/admin/bookings` and `/api/v1/public/bookings`.
  - Move create/update logic to `src/server/services/booking.service.ts`.

- `lib/services/reviews.ts`
  - Replace localStorage/seeding with read/write via `/api/v1/admin/reviews` and public read via `/api/v1/public/reviews`.

- `lib/services/vault.ts`
  - Replace localStorage/seeding with read/write via `/api/v1/admin/vault` and public read via `/api/v1/public/vault`.

- `lib/constants.ts`
  - Keep UI constants.
  - Move data persistence functions to server services/repositories.

- `app/api/auth/login/route.ts`
  - Keep route responsibility thin.
  - Delegate to `src/server/services/auth.service.ts` (or `src/server/auth/session.ts`) and validation schema.

- `app/api/bookings/route.ts`
  - Replace in-memory array with service + repository layer.
  - Split into admin/public endpoints with role checks.

- `app/admin/*/page.tsx`
  - Replace repeated client-side `isAuthenticated()` checks with middleware + server session checks.
  - Keep page-level guards only for UX fallbacks.

- `app/api/admin/*` and `app/api/public/*`
  - Keep these endpoint domains, but version under `/api/v1/*` for long-term compatibility.

- `app/api/media/*`
  - Implement upload/download contracts in dedicated media service.

- `db/schema/`
  - Add SQL migrations and DB constraints first; API implementation second.

## Security Hardening Priorities

1. Remove hardcoded credentials and localStorage auth.
2. Use HTTP-only secure cookies for sessions.
3. Add request payload validation on every write route.
4. Enforce RBAC (admin/public) in route wrappers.
5. Add rate limiting on auth and public submit endpoints.
6. Store password hashes only (never plaintext in localStorage).

## API Versioning and Response Contract

- Prefix all new endpoints with `/api/v1`.
- Standard response shape:
  - success: `{ ok: true, data, meta? }`
  - error: `{ ok: false, error: { code, message, details? } }`

## Migration Phases

### Phase 1 (Safety + Auth)
- Implement server session strategy.
- Add middleware route protection for admin paths.
- Migrate login endpoint to server auth service.

### Phase 2 (Persistence)
- Define DB schema and migrations.
- Replace bookings/reviews/vault storage with repositories.
- Move social/profile/site-content persistence to DB.

### Phase 3 (API Completion)
- Implement all empty admin/public/media routes.
- Add validation and centralized error handling wrappers.

### Phase 4 (Operational Readiness)
- Add audit logs for admin mutations.
- Add basic integration tests for auth + bookings + reviews.
- Add production docs: env setup, migration commands, rollback notes.

## Suggested First Deliverables

1. `db/schema/001_init.sql` with users, sessions, bookings, reviews, vault, profile, social_links, site_content.
2. `src/server/db/client.ts` and `src/server/http/errors.ts`.
3. `/api/v1/auth/login` + `/api/v1/auth/session`.
4. `/api/v1/admin/bookings` and `/api/v1/public/bookings`.
5. Middleware protection for `/admin/*`.
