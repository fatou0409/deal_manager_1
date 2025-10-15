// src/utils/prisma.js
import { PrismaClient } from '@prisma/client'

let prismaGlobal = globalThis.__PRISMA__ || null
if (!prismaGlobal) {
  prismaGlobal = new PrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__PRISMA__ = prismaGlobal
  }
}
export const prisma = prismaGlobal
