/*
  Warnings:

  - You are about to drop the column `ca` on the `Pipe` table. All the data in the column will be lost.
  - You are about to drop the column `commercial` on the `Pipe` table. All the data in the column will be lost.
  - You are about to drop the column `dateCreation` on the `Pipe` table. All the data in the column will be lost.
  - You are about to drop the column `projet` on the `Pipe` table. All the data in the column will be lost.
  - You are about to drop the column `statut` on the `Pipe` table. All the data in the column will be lost.
  - Added the required column `ic` to the `Pipe` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client" TEXT NOT NULL,
    "ic" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "projets" TEXT,
    "budget" REAL NOT NULL DEFAULT 0,
    "semestre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Pipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pipe" ("client", "createdAt", "id", "secteur", "semestre", "updatedAt", "userId") SELECT "client", "createdAt", "id", "secteur", "semestre", "updatedAt", "userId" FROM "Pipe";
DROP TABLE "Pipe";
ALTER TABLE "new_Pipe" RENAME TO "Pipe";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
