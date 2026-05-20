import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function clearSkillsTable() {
  try {
    console.log("⏳ Purging all existing skills and relation records...");

    await prisma.$connect();

    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "Skill" CASCADE;`
    );

    console.log("✅ Skill table is completely empty.");
  } catch (e) {
    console.error("❌ Clear failed:", e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

clearSkillsTable();