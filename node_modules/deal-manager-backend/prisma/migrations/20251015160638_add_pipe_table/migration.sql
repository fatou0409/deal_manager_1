-- CreateTable
CREATE TABLE "Pipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client" TEXT NOT NULL,
    "commercial" TEXT,
    "secteur" TEXT NOT NULL,
    "projet" TEXT NOT NULL,
    "ca" REAL NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Open',
    "semestre" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Pipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
