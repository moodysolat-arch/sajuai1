-- AlterTable UserProfile
ALTER TABLE "UserProfile" ADD COLUMN "firebaseUid" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "UserProfile_firebaseUid_key" ON "UserProfile"("firebaseUid");

-- AlterTable Asset: add profileId (backfill from oldest profile)
ALTER TABLE "Asset" ADD COLUMN "profileId" TEXT;

UPDATE "Asset"
SET "profileId" = (
  SELECT "id" FROM "UserProfile" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "profileId" IS NULL;

-- Fallback if no profile exists yet: leave null then delete orphan assets
DELETE FROM "Asset" WHERE "profileId" IS NULL;

-- Recreate Asset table with NOT NULL profileId + FK (SQLite)
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institutionOrLocation" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "fxRateToKrw" INTEGER NOT NULL DEFAULT 1,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "debtValue" INTEGER NOT NULL DEFAULT 0,
    "monthlyIncome" INTEGER NOT NULL DEFAULT 0,
    "monthlyExpense" INTEGER NOT NULL DEFAULT 0,
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Asset" ("id", "profileId", "type", "name", "institutionOrLocation", "currency", "fxRateToKrw", "currentValue", "debtValue", "monthlyIncome", "monthlyExpense", "memo", "createdAt", "updatedAt")
SELECT "id", "profileId", "type", "name", "institutionOrLocation", "currency", "fxRateToKrw", "currentValue", "debtValue", "monthlyIncome", "monthlyExpense", "memo", "createdAt", "updatedAt" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE INDEX "Asset_profileId_idx" ON "Asset"("profileId");
PRAGMA foreign_keys=ON;
