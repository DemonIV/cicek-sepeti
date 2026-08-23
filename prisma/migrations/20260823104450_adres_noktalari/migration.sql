-- CreateTable
CREATE TABLE "Landmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    CONSTRAINT "Landmark_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "fullAddress" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "neighborhoodId" TEXT,
    CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Address_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Address" ("city", "district", "fullAddress", "id", "isDefault", "title", "userId") SELECT "city", "district", "fullAddress", "id", "isDefault", "title", "userId" FROM "Address";
DROP TABLE "Address";
ALTER TABLE "new_Address" RENAME TO "Address";
CREATE INDEX "Address_userId_idx" ON "Address"("userId");
CREATE INDEX "Address_neighborhoodId_idx" ON "Address"("neighborhoodId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Landmark_neighborhoodId_idx" ON "Landmark"("neighborhoodId");
