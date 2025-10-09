/*
  Warnings:

  - You are about to drop the column `achieved` on the `Objective` table. All the data in the column will be lost.
  - You are about to drop the column `target` on the `Objective` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Objective" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "ca" REAL NOT NULL DEFAULT 0,
    "marge" REAL NOT NULL DEFAULT 0,
    "visites" INTEGER NOT NULL DEFAULT 0,
    "one2one" INTEGER NOT NULL DEFAULT 0,
    "workshops" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Objective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Objective" ("createdAt", "id", "period", "updatedAt", "userId") SELECT "createdAt", "id", "period", "updatedAt", "userId" FROM "Objective";
DROP TABLE "Objective";
ALTER TABLE "new_Objective" RENAME TO "Objective";
CREATE UNIQUE INDEX "Objective_userId_period_key" ON "Objective"("userId", "period");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
