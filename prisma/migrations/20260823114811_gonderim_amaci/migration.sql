-- CreateTable
CREATE TABLE "Occasion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ProductOccasion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "occasionId" TEXT NOT NULL,
    CONSTRAINT "ProductOccasion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductOccasion_occasionId_fkey" FOREIGN KEY ("occasionId") REFERENCES "Occasion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Occasion_slug_key" ON "Occasion"("slug");

-- CreateIndex
CREATE INDEX "ProductOccasion_occasionId_idx" ON "ProductOccasion"("occasionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOccasion_productId_occasionId_key" ON "ProductOccasion"("productId", "occasionId");
