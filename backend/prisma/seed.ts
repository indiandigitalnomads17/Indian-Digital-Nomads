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

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});


interface LeafSkill {
  name: string;
}

interface SubSkill {
  name: string;
  leaves: string[];
}

interface ParentSkill {
  name: string;
  subSkills: SubSkill[];
}

interface Category {
  name: string;
  parentSkills: ParentSkill[];
}

async function main() {
  await prisma.$connect();
  const skillData: Category[] = [
    {
      name: "IT Services",
      parentSkills: [
        {
          name: "Web Development",
          subSkills: [
            {
              name: "Frontend Development",
              leaves: ["React", "Next.js", "Vue.js", "Tailwind CSS", "TypeScript"],
            },
            {
              name: "Backend Development",
              leaves: ["Node.js", "Express", "Python", "Go", "PostgreSQL"],
            },
            {
              name: "Full Stack Development",
              leaves: ["MERN Stack", "T3 Stack", "Serverless Architecture"],
            },
          ],
        },
        {
          name: "Mobile Development",
          subSkills: [
            {
              name: "Cross-Platform Development",
              leaves: ["Flutter", "React Native"],
            },
            {
              name: "Native Development",
              leaves: ["Swift", "Kotlin", "Objective-C", "Java Mobile"],
            },
          ],
        },
        {
          name: "Cybersecurity Ops",
          subSkills: [
            {
              name: "Ethical Hacking",
              leaves: ["Penetration Testing", "Bug Bounty", "Network Security Assessment"],
            },
            {
              name: "Cloud Security Architecture",
              leaves: ["AWS Security Hub", "Azure Compliance", "IAM Optimization"],
            },
          ],
        },
        {
          name: "Emerging Tech & Web3",
          subSkills: [
            {
              name: "Blockchain Development",
              leaves: ["Solidity", "Smart Contracts", "Rust Development"],
            },
          ],
        },
      ],
    },
    {
      name: "Digital Services",
      parentSkills: [
        {
          name: "Graphics & Design",
          subSkills: [
            {
              name: "Brand Identity",
              leaves: ["Logo Design", "Brand Guidelines", "Typography"],
            },
            {
              name: "Visual Arts",
              leaves: ["Poster Designing", "Illustration", "Vector Art"],
            },
            {
              name: "Product Design",
              leaves: ["UI/UX Design", "Figma Frameworks", "Wireframing", "Prototyping"],
            },
          ],
        },
        {
          name: "Digital Marketing",
          subSkills: [
            {
              name: "Social Media Marketing",
              leaves: ["Instagram Growth", "Meta Ads Manager", "TikTok Strategy"],
            },
            {
              name: "Search Engine Optimization",
              leaves: ["On-page SEO", "Technical SEO", "Backlink Building"],
            },
            {
              name: "Content Marketing",
              leaves: ["Email Marketing", "Funnel Building", "Newsletter Management"],
            },
          ],
        },
        {
          name: "Video & Animation",
          subSkills: [
            {
              name: "Video Editing",
              leaves: ["Adobe Premiere Pro", "DaVinci Resolve", "Color Grading workflows"],
            },
            {
              name: "Motion Graphics",
              leaves: ["After Effects core", "2D Animation", "Explainer Videos production"],
            },
            {
              name: "3D Modeling",
              leaves: ["Blender Engine", "Cinema 4D", "Character Design modeling"],
            },
          ],
        },
        {
          name: "Writing & Translation",
          subSkills: [
            {
              name: "Creative Writing",
              leaves: ["Ghostwriting", "Scriptwriting", "Storytelling composition"],
            },
            {
              name: "Business Writing",
              leaves: ["Technical Writing", "Grant Writing", "Whitepapers compilation"],
            },
            {
              name: "Copywriting Tasks",
              leaves: ["Ad Copy", "Sales Pages landing", "Email Sequences writing"],
            },
          ],
        },
        {
          name: "Data Science & AI",
          subSkills: [
            {
              name: "Machine Learning",
              leaves: ["PyTorch pipelines", "TensorFlow setups", "Scikit-learn mapping"],
            },
            {
              name: "Data Analysis Engine",
              leaves: ["Pandas frame manipulations", "Tableau views", "PowerBI reporting", "SQL queries"],
            },
            {
              name: "AI Integrations Infrastructure",
              leaves: ["Prompt Engineering workflows", "OpenAI API calls", "LangChain architectures"],
            },
          ],
        },
        {
          name: "Business & Admin Support",
          subSkills: [
            {
              name: "Virtual Assistant Operations",
              leaves: ["Data Entry processing", "Calendar Management optimization", "Customer Support management"],
            },
            {
              name: "Project Management Systems",
              leaves: ["Agile execution", "Scrum methodologies", "Jira administration", "Trello operations"],
            },
          ],
        },
      ],
    },
    {
      name: "Healthcare Services",
      parentSkills: [
        {
          name: "Medical Professionals",
          subSkills: [
            {
              name: "Doctors Consultation",
              leaves: ["General Medicine", "Pediatrics", "Dermatology", "Cardiology Consultation"],
            },
          ],
        },
        {
          name: "Clinical Infrastructure",
          subSkills: [
            {
              name: "Hospitals Operations",
              leaves: ["Emergency Care", "Inpatient Diagnostics", "Outpatient Checkups"],
            },
          ],
        },
      ],
    },
    {
      name: "Household Services",
      parentSkills: [
        {
          name: "Construction & Carpentry",
          subSkills: [
            {
              name: "General Maintenance",
              leaves: ["Wall Repair", "Hinges Fixing", "Furniture Touchup"],
            },
            {
              name: "Carpentry Works",
              leaves: ["Cabinet Making", "Door Installation", "Wood Framing"],
            },
            {
              name: "Interior Architecture",
              leaves: ["Space Layout Planning", "Modular Kitchen Design", "Wall Paint Selection"],
            },
          ],
        },
        {
          name: "Plumbing Services",
          subSkills: [
            {
              name: "Leak Repair Work",
              leaves: ["Ceiling Leak Fixing", "Faucet Leak Sealing", "Pipe Joint Compound Application"],
            },
            {
              name: "Pipe Infrastructure",
              leaves: ["Main Line Pipe Replacement", "Drain Line Clearing", "Copper Pipe Welding"],
            },
            {
              name: "Bathroom Fitting Maintenance",
              leaves: ["Shower Installation", "Commode Fixing", "Geyser Inlet Repairs"],
            },
          ],
        },
        {
          name: "Electrical Services",
          subSkills: [
            {
              name: "Switch & Board Repair",
              leaves: ["Modular Switch Replacement", "Socket Board Grounding", "Dimmer Installation"],
            },
            {
              name: "Wiring Systems",
              leaves: ["Concealed Conduit Wiring", "Short Circuit Diagnosis", "Home Re-wiring Projects"],
            },
            {
              name: "Lights Architecture",
              leaves: ["LED Panel Setup", "Chandelier Assembly", "Outdoor Accent Lighting Installation"],
            },
            {
              name: "Inverter Maintenance",
              leaves: ["Battery Acid Distilled Refill", "Inverter Fuse Swap", "Backup Relay Inspection"],
            },
            {
              name: "Circuit Inspection Safety",
              leaves: ["MCB Tripping Isolation", "ELCB Earth Leakage Test", "Main Distribution Board Diagnostics"],
            },
          ],
        },
        {
          name: "HVAC Systems",
          subSkills: [
            {
              name: "AC & Heating Repair",
              leaves: ["Compressor Troubleshooting", "Refrigerant Gas Leak Recharge", "Capacitor Swap"],
            },
            {
              name: "Climate Component Installation",
              leaves: ["Split AC Mounting", "Window Unit Setup", "Central Duct Ventilation Fitting"],
            },
            {
              name: "Filter Cleaning & Servicing",
              leaves: ["Condenser Coil Foam Clean", "Air Filter Dust Evacuation", "Drain Line Flush"],
            },
          ],
        },
        {
          name: "Cleaning & Hygiene",
          subSkills: [
            {
              name: "Maids Operations",
              leaves: ["Floor Mopping", "Utensil Washing", "Deep Kitchen Scrubbing"],
            },
            {
              name: "Gardening & Landscaping",
              leaves: ["Lawn Mowing", "Weed Pest Extermination", "Soil Fertilization Treatment"],
            },
            {
              name: "Sewerage Clearance",
              leaves: ["Septic Tank Suction Pump", "Main Hole Blockage Clearance", "Gully Trap Flushes"],
            },
          ],
        },
        {
          name: "Logistics Services",
          subSkills: [
            {
              name: "Delivery Services",
              leaves: ["Hyperlocal Courier Delivery", "E-commerce Parcel Drop", "Fragile Document Delivery"],
            },
            {
              name: "Transport Fleet Management",
              leaves: ["Packers and Movers Transport", "Intra-city Flatbed Loading", "Two-Wheeler Logistics Tracking"],
            },
          ],
        },
      ],
    },
  ];

  console.log("🌱 Starting 4-tier structural tree database seeding process...");

  for (const category of skillData) {
    // TIER 1: Category Mapping
    const tier1Node = await prisma.skill.upsert({
      where: { name: category.name },
      update: { tier: 1 },
      create: { name: category.name, tier: 1 },
    });

    console.log(` 🔹 Tier 1 Category Seeded: ${tier1Node.name}`);

    for (const parent of category.parentSkills) {
      // TIER 2: Parent Skill mapping
      const tier2Node = await prisma.skill.upsert({
        where: { name: parent.name },
        update: { parentId: tier1Node.id, tier: 2 },
        create: { name: parent.name, parentId: tier1Node.id, tier: 2 },
      });

      for (const sub of parent.subSkills) {
        // TIER 3: Subskill mapping
        const tier3Node = await prisma.skill.upsert({
          where: { name: sub.name },
          update: { parentId: tier2Node.id, tier: 3 },
          create: { name: sub.name, parentId: tier2Node.id, tier: 3 },
        });

        for (const leaf of sub.leaves) {
          // TIER 4: Atomic Leaf Skill mapping
          await prisma.skill.upsert({
            where: { name: leaf },
            update: { parentId: tier3Node.id, tier: 4 },
            create: { name: leaf, parentId: tier3Node.id, tier: 4 },
          });
        }
      }
    }
  }

  console.log("🚀 4-Tier recursive taxonomy sync complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding runtime process failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect()
  });