-- CreateTable
CREATE TABLE "page_visits" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "session_id" TEXT,
    "referrer" TEXT,
    "user_agent" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "language" TEXT,
    "country" TEXT,
    "ip_hash" TEXT,
    "visited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_visits_visited_at_idx" ON "page_visits"("visited_at");

-- CreateIndex
CREATE INDEX "page_visits_browser_idx" ON "page_visits"("browser");

-- CreateIndex
CREATE INDEX "page_visits_path_idx" ON "page_visits"("path");

-- CreateIndex
CREATE INDEX "page_visits_device_type_idx" ON "page_visits"("device_type");

-- CreateIndex
CREATE INDEX "page_visits_session_id_visited_at_idx" ON "page_visits"("session_id", "visited_at");

-- CreateIndex
CREATE INDEX "page_visits_path_visited_at_idx" ON "page_visits"("path", "visited_at");
