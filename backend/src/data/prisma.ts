import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { config } from '../config/index.js'

const pool = new pg.Pool({ connectionString: config.database.url })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })

export async function isDatabaseEmpty(): Promise<boolean> {
  const count = await prisma.team.count()
  return count === 0
}

export default prisma
