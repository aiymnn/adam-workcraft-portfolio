-- Create table for Story section looping logos managed from admin panel
CREATE TABLE IF NOT EXISTS "story_loop_logos" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "src" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "story_loop_logos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "story_loop_logos_sortOrder_idx" ON "story_loop_logos"("sortOrder");
