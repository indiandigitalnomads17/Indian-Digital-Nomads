import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// 1. Load the environment variables
dotenv.config();

// 2. Setup the adapter (Same as your prisma.config/client)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 3. Initialize the client WITH the adapter
const prisma = new PrismaClient({ adapter });

interface SkillCategory {
  category: string;
  subSkills: string[];
}

async function main() {
  // 2. Assign the type to the array
  const skillData: SkillCategory[] = [
    {
      category: "Software Development",
      subSkills: ["React", "Node.js", "Next.js", "TypeScript", "Python", "Go", "Solidity", "Rust", "PostgreSQL", "Docker"],
    },
    {
      category: "Design & Creative",
      subSkills: ["UI/UX Design", "Figma", "Adobe Photoshop", "Illustrator", "Brand Identity", "3D Modeling", "Canva"],
    },
  ];

  console.log("🌱 Starting to seed skills...");

  for (const item of skillData) {
   
    const parent = await prisma.skill.upsert({
      where: { name: item.category },
      update: {},
      create: { name: item.category },
    });

    for (const subName of item.subSkills) {
      await prisma.skill.upsert({
        where: { name: subName },
        update: { parentId: parent.id },
        create: {
          name: subName,
          parentId: parent.id,
        },
      });
    }
  }

  console.log("Seeding complete!");
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });