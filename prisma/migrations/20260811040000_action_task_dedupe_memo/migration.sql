-- RedefineActionTask with dedupeKey, completionCriteria, memo
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ActionTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "completionCriteria" TEXT NOT NULL DEFAULT '',
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "source" TEXT NOT NULL DEFAULT 'FINANCE',
    "dedupeKey" TEXT NOT NULL,
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionTask_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_ActionTask" (
  "id", "profileId", "title", "category", "reason", "completionCriteria",
  "dueDate", "status", "source", "dedupeKey", "memo", "createdAt", "updatedAt"
)
SELECT
  "id",
  "profileId",
  "title",
  "category",
  "reason",
  '',
  "dueDate",
  "status",
  "source",
  "title",
  NULL,
  "createdAt",
  "updatedAt"
FROM "ActionTask";

DROP TABLE "ActionTask";
ALTER TABLE "new_ActionTask" RENAME TO "ActionTask";
CREATE UNIQUE INDEX "ActionTask_profileId_dedupeKey_key" ON "ActionTask"("profileId", "dedupeKey");
CREATE INDEX "ActionTask_profileId_status_idx" ON "ActionTask"("profileId", "status");
CREATE INDEX "ActionTask_profileId_dueDate_idx" ON "ActionTask"("profileId", "dueDate");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
