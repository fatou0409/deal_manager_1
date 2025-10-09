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
    CONSTRAINT "Objective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Objective" ("ca", "createdAt", "id", "marge", "one2one", "period", "updatedAt", "userId", "visites", "workshops") SELECT "ca", "createdAt", "id", "marge", "one2one", "period", "updatedAt", "userId", "visites", "workshops" FROM "Objective";
DROP TABLE "Objective";
ALTER TABLE "new_Objective" RENAME TO "Objective";
CREATE UNIQUE INDEX "Objective_userId_period_key" ON "Objective"("userId", "period");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
