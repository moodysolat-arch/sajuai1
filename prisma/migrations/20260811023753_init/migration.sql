-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "calendarType" TEXT NOT NULL DEFAULT 'SOLAR',
    "birthDate" TEXT NOT NULL,
    "birthTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "riskLevel" TEXT NOT NULL DEFAULT 'BALANCED',
    "goal" TEXT NOT NULL,
    "monthlyExpense" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institutionOrLocation" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "fxRateToKrw" DECIMAL NOT NULL DEFAULT 1,
    "currentValue" DECIMAL NOT NULL DEFAULT 0,
    "debtValue" DECIMAL NOT NULL DEFAULT 0,
    "monthlyIncome" DECIMAL NOT NULL DEFAULT 0,
    "monthlyExpense" DECIMAL NOT NULL DEFAULT 0,
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RealEstateDetail" (
    "assetId" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT,
    "purchasePrice" DECIMAL,
    "loanBalance" DECIMAL,
    "interestRate" DECIMAL,
    "leaseType" TEXT,
    "nextReviewDate" TEXT,
    CONSTRAINT "RealEstateDetail_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockHolding" (
    "assetId" TEXT NOT NULL PRIMARY KEY,
    "ticker" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "averagePrice" DECIMAL NOT NULL,
    "currentPrice" DECIMAL NOT NULL,
    "sector" TEXT,
    CONSTRAINT "StockHolding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashAccount" (
    "assetId" TEXT NOT NULL PRIMARY KEY,
    "accountType" TEXT NOT NULL,
    "interestRate" DECIMAL,
    "maturityDate" TEXT,
    "isEmergencyFund" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CashAccount_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessDetail" (
    "assetId" TEXT NOT NULL PRIMARY KEY,
    "ownershipRate" DECIMAL,
    "valuationBasis" TEXT,
    "liquidityGrade" TEXT,
    CONSTRAINT "BusinessDetail_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValuationSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "value" DECIMAL NOT NULL,
    "debt" DECIMAL NOT NULL DEFAULT 0,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValuationSnapshot_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FortuneSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "pillarsJson" TEXT NOT NULL,
    "decadeCyclesJson" TEXT NOT NULL,
    "monthlyScoresJson" TEXT NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FortuneSnapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "source" TEXT NOT NULL DEFAULT 'FINANCE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionTask_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FortuneSnapshot_profileId_year_provider_key" ON "FortuneSnapshot"("profileId", "year", "provider");
