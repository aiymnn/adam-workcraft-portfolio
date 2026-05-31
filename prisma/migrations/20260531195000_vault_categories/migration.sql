-- Create table for admin-managed vault categories
CREATE TABLE IF NOT EXISTS "vault_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vault_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vault_categories_name_key" ON "vault_categories"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "vault_categories_slug_key" ON "vault_categories"("slug");
CREATE INDEX IF NOT EXISTS "vault_categories_sort_order_idx" ON "vault_categories"("sort_order");
CREATE INDEX IF NOT EXISTS "vault_categories_is_active_idx" ON "vault_categories"("is_active");

-- Seed default professional categories (safe re-run with ON CONFLICT)
INSERT INTO "vault_categories" ("id", "name", "slug", "sort_order", "is_active", "created_at", "updated_at") VALUES
  ('vault_cat_wedding', 'Wedding Photography', 'wedding-photography', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('vault_cat_event_video', 'Event Videography', 'event-videography', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('vault_cat_corporate', 'Corporate Shoot', 'corporate-shoot', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('vault_cat_short_film', 'Short Film', 'short-film', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('vault_cat_image_tracing', 'Image Tracing', 'image-tracing', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('vault_cat_logo_design', 'Logo Design', 'logo-design', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('vault_cat_poster_design', 'Poster Design', 'poster-design', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('vault_cat_graphic_design', 'Graphic Design', 'graphic-design', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
