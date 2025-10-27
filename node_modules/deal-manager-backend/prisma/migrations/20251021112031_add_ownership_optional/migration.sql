/*
  Warnings:

  - You are about to drop the column `userId` on the `Pipe` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "DealHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "changedById" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diff" JSONB NOT NULL,
    CONSTRAINT "DealHistory_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DealHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Objective" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "ca" REAL NOT NULL,
    "marge" REAL NOT NULL,
    "visites" INTEGER NOT NULL,
    "one2one" INTEGER NOT NULL,
    "workshops" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Objective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Objective" ("ca", "createdAt", "id", "marge", "one2one", "period", "updatedAt", "userId", "visites", "workshops") SELECT "ca", "createdAt", "id", "marge", "one2one", "period", "updatedAt", "userId", "visites", "workshops" FROM "Objective";
DROP TABLE "Objective";
ALTER TABLE "new_Objective" RENAME TO "Objective";
CREATE INDEX "Objective_userId_idx" ON "Objective"("userId");
CREATE UNIQUE INDEX "Objective_userId_period_key" ON "Objective"("userId", "period");
CREATE TABLE "new_ObjectiveHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "by" TEXT NOT NULL,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ObjectiveHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ObjectiveHistory" ("by", "id", "period", "ts", "userId", "values") SELECT "by", "id", "period", "ts", "userId", "values" FROM "ObjectiveHistory";
DROP TABLE "ObjectiveHistory";
ALTER TABLE "new_ObjectiveHistory" RENAME TO "ObjectiveHistory";
CREATE INDEX "ObjectiveHistory_userId_period_idx" ON "ObjectiveHistory"("userId", "period");
CREATE TABLE "new_Pipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client" TEXT NOT NULL,
    "ic" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "projets" TEXT,
    "budget" REAL NOT NULL DEFAULT 0,
    "semestre" TEXT,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pipe_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pipe" ("budget", "client", "createdAt", "ic", "id", "projets", "secteur", "semestre", "updatedAt") SELECT "budget", "client", "createdAt", "ic", "id", "projets", "secteur", "semestre", "updatedAt" FROM "Pipe";
DROP TABLE "Pipe";
ALTER TABLE "new_Pipe" RENAME TO "Pipe";
CREATE INDEX "Pipe_ownerId_idx" ON "Pipe"("ownerId");
CREATE INDEX "Pipe_semestre_idx" ON "Pipe"("semestre");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Deal_ownerId_idx" ON "Deal"("ownerId");

-- CreateIndex
CREATE INDEX "Deal_semestre_idx" ON "Deal"("semestre");

-- CreateIndex
CREATE INDEX "Visit_userId_idx" ON "Visit"("userId");

-- CreateIndex
CREATE INDEX "Visit_semestre_idx" ON "Visit"("semestre");
