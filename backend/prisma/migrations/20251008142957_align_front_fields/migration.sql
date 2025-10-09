/*
  Warnings:

  - You are about to drop the column `amount` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `projets` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Visit` table. All the data in the column will be lost.
  - Added the required column `client` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projet` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semestre` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statut` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Made the column `secteur` on table `Deal` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `client` to the `Visit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secteur` to the `Visit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semestre` to the `Visit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sujet` to the `Visit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Visit` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projet" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "typeDeal" TEXT,
    "commercial" TEXT,
    "supportAV" TEXT,
    "semestre" TEXT NOT NULL,
    "ca" REAL NOT NULL DEFAULT 0,
    "marge" REAL NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT,
    CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deal" ("createdAt", "id", "ownerId", "secteur", "updatedAt") SELECT "createdAt", "id", "ownerId", "secteur", "updatedAt" FROM "Deal";
DROP TABLE "Deal";
ALTER TABLE "new_Deal" RENAME TO "Deal";
CREATE TABLE "new_Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "semestre" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "accompagnants" TEXT,
    "dealId" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Visit_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Visit" ("createdAt", "date", "dealId", "id", "status", "updatedAt", "userId") SELECT "createdAt", "date", "dealId", "id", "status", "updatedAt", "userId" FROM "Visit";
DROP TABLE "Visit";
ALTER TABLE "new_Visit" RENAME TO "Visit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
