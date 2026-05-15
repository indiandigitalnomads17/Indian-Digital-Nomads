import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface SubCategory {
  name: string;
  skills: string[]; 
}

interface ParentCategory {
  name: string;
  subCategories: SubCategory[]; 
}

async function main() {
  const skillData: ParentCategory[] = [
    {
      name: "Web Development",
      subCategories: [
        {
          name: "Frontend Development",
          skills: ["React", "Next.js", "Vue.js", "Tailwind CSS", "TypeScript"],
        },
        {
          name: "Backend Development",
          skills: ["Node.js", "Express", "Python", "Go", "PostgreSQL"],
        },
        {
          name: "Full Stack Development",
          skills: ["MERN Stack", "T3 Stack", "Serverless Architecture"],
        },
      ],
    },
    {
      name: "Graphics & Design",
      subCategories: [
        {
          name: "Brand Identity",
          skills: ["Logo Design", "Brand Guidelines", "Typography"],
        },
        {
          name: "Visual Arts",
          skills: ["Poster Designing", "Illustration", "Vector Art"],
        },
        {
          name: "Product Design",
          skills: ["UI/UX Design", "Figma", "Wireframing", "Prototyping"],
        },
      ],
    },
    {
      name: "Digital Marketing",
      subCategories: [
        {
          name: "Social Media Marketing",
          skills: ["Instagram Growth", "Meta Ads", "TikTok Strategy"],
        },
        {
          name: "Search Engine Optimization",
          skills: ["On-page SEO", "Technical SEO", "Backlink Building"],
        },
        {
          name: "Content Marketing",
          skills: ["Email Marketing", "Funnel Building", "Newsletter Management"],
        },
      ],
    },
    {
      name: "Video & Animation",
      subCategories: [
        {
          name: "Video Editing",
          skills: ["Adobe Premiere Pro", "DaVinci Resolve", "Color Grading"],
        },
        {
          name: "Motion Graphics",
          skills: ["After Effects", "2D Animation", "Explainer Videos"],
        },
        {
          name: "3D Modeling",
          skills: ["Blender", "Cinema 4D", "Character Design"],
        },
      ],
    },
    {
      name: "Writing & Translation",
      subCategories: [
        {
          name: "Creative Writing",
          skills: ["Ghostwriting", "Scriptwriting", "Storytelling"],
        },
        {
          name: "Business Writing",
          skills: ["Technical Writing", "Grant Writing", "Whitepapers"],
        },
        {
          name: "Copywriting",
          skills: ["Ad Copy", "Sales Pages", "Email Sequences"],
        },
      ],
    },
    {
      name: "Data Science & AI",
      subCategories: [
        {
          name: "Machine Learning",
          skills: ["PyTorch", "TensorFlow", "Scikit-learn"],
        },
        {
          name: "Data Analysis",
          skills: ["Pandas", "Tableau", "PowerBI", "SQL"],
        },
        {
          name: "AI Integrations",
          skills: ["Prompt Engineering", "OpenAI API", "LangChain"],
        },
      ],
    },
    {
      name: "Mobile Development",
      subCategories: [
        {
          name: "Cross-Platform",
          skills: ["Flutter", "React Native"],
        },
        {
          name: "Native Development",
          skills: ["Swift", "Kotlin"],
        },
      ],
    },
    {
      name: "Cybersecurity",
      subCategories: [
        {
          name: "Ethical Hacking",
          skills: ["Penetration Testing", "Bug Bounty", "Network Security"],
        },
        {
          name: "Cloud Security",
          skills: ["AWS Security", "Azure Compliance"],
        },
      ],
    },
    {
      name: "Business & Admin",
      subCategories: [
        {
          name: "Virtual Assistant",
          skills: ["Data Entry", "Calendar Management", "Customer Support"],
        },
        {
          name: "Project Management",
          skills: ["Agile", "Scrum", "Jira", "Trello"],
        },
      ],
    },
    {
      name: "Emerging Tech & Web3",
      subCategories: [
        {
          name: "Blockchain",
          skills: ["Solidity", "Smart Contracts", "Rust"],
        },
      ],
    },
  ];

  console.log("🌱 Starting 3-tier tree database seeding...");

  for (const parentItem of skillData) {
    const parent = await prisma.skill.upsert({
      where: { name: parentItem.name },
      update: { tier: 1 },
      create: { 
        name: parentItem.name,
        tier: 1
      },
    });

    console.log(` 🔹 Parent Node Seeded: ${parent.name}`);

    for (const subItem of parentItem.subCategories) {
      // TIER 2: Sub-Categories
      const subCategory = await prisma.skill.upsert({
        where: { name: subItem.name },
        update: { 
          parentId: parent.id,
          tier: 2
        },
        create: {
          name: subItem.name,
          parentId: parent.id,
          tier: 2
        },
      });

      for (const leafName of subItem.skills) {
        await prisma.skill.upsert({
          where: { name: leafName },
          update: { 
            parentId: subCategory.id,
            tier: 3
          },
          create: {
            name: leafName,
            parentId: subCategory.id,
            tier: 3
          },
        });
      }
    }
  }

  console.log(" Complete  map successfully synchronized with the database!");
}

main()
  .catch((e) => {
    console.error("Seeding   failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });