-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Asset" ("createdAt", "currency", "currentValue", "debtValue", "fxRateToKrw", "id", "institutionOrLocation", "memo", "monthlyExpense", "monthlyIncome", "name", "type", "updatedAt") SELECT "createdAt", "currency", "currentValue", "debtValue", "fxRateToKrw", "id", "institutionOrLocation", "memo", "monthlyExpense", "monthlyIncome", "name", "type", "updatedAt" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE TABLE "new_RealEstateDetail" (
    "assetId" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT,
    "purchasePrice" INTEGER,
    "loanBalance" INTEGER,
    "interestRate" DECIMAL,
    "leaseType" TEXT,
    "nextReviewDate" TEXT,
    CONSTRAINT "RealEstateDetail_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RealEstateDetail" ("address", "assetId", "interestRate", "leaseType", "loanBalance", "nextReviewDate", "purchasePrice") SELECT "address", "assetId", "interestRate", "leaseType", "loanBalance", "nextReviewDate", "purchasePrice" FROM "RealEstateDetail";
DROP TABLE "RealEstateDetail";
ALTER TABLE "new_RealEstateDetail" RENAME TO "RealEstateDetail";
CREATE TABLE "new_StockHolding" (
    "assetId" TEXT NOT NULL PRIMARY KEY,
    "ticker" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "averagePrice" INTEGER NOT NULL,
    "currentPrice" INTEGER NOT NULL,
    "sector" TEXT,
    CONSTRAINT "StockHolding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StockHolding" ("assetId", "averagePrice", "currentPrice", "quantity", "sector", "ticker") SELECT "assetId", "averagePrice", "currentPrice", "quantity", "sector", "ticker" FROM "StockHolding";
DROP TABLE "StockHolding";
ALTER TABLE "new_StockHolding" RENAME TO "StockHolding";
CREATE TABLE "new_UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "calendarType" TEXT NOT NULL DEFAULT 'SOLAR',
    "birthDate" TEXT NOT NULL,
    "birthTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "riskLevel" TEXT NOT NULL DEFAULT 'BALANCED',
    "goal" TEXT NOT NULL,
    "monthlyExpense" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserProfile" ("birthDate", "birthTime", "calendarType", "createdAt", "goal", "id", "monthlyExpense", "name", "riskLevel", "timezone", "updatedAt") SELECT "birthDate", "birthTime", "calendarType", "createdAt", "goal", "id", "monthlyExpense", "name", "riskLevel", "timezone", "updatedAt" FROM "UserProfile";
DROP TABLE "UserProfile";
ALTER TABLE "new_UserProfile" RENAME TO "UserProfile";
CREATE TABLE "new_ValuationSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "debt" INTEGER NOT NULL DEFAULT 0,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValuationSnapshot_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ValuationSnapshot" ("assetId", "capturedAt", "debt", "id", "value") SELECT "assetId", "capturedAt", "debt", "id", "value" FROM "ValuationSnapshot";
DROP TABLE "ValuationSnapshot";
ALTER TABLE "new_ValuationSnapshot" RENAME TO "ValuationSnapshot";
CREATE INDEX "ValuationSnapshot_assetId_capturedAt_idx" ON "ValuationSnapshot"("assetId", "capturedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ActionTask_profileId_status_idx" ON "ActionTask"("profileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ActionTask_profileId_title_key" ON "ActionTask"("profileId", "title");

