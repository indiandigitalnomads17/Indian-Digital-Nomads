import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const prismaClientSingleton = () => {
  // 👇 Detect environment
  const isProduction = process.env.NODE_ENV === 'production';

  // 👇 Use correct DB URL based on environment
  const connectionString = isProduction
    ? process.env.DATABASE_URL        // Render INTERNAL (set in dashboard)
    : process.env.DIRECT_URL;         // Local EXTERNAL

  if (!connectionString) {
    throw new Error("Database URL not found in environment variables");
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // required for Render
    },
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}