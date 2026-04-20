import prisma from "./src/config/prisma";

const skills = [
  "Website Development",
  "Content Writing",
  "Graphic Design",
  "Social Media Marketing",
  "Video Editing",
  "Data Entry",
  "Mobile App Development",
  "UI/UX Design",
  "Digital Illustration",
  "Translation Services",
  "Virtual Assistant",
  "SEO Optimization",
  "Photography",
  "Presentation Design",
  "Programming (Python/Java/C++)",
  "Content Creation (Tiktok/Reels)",
  "Market Research",
  "Voiceover Acting",
  "Tutoring (Subjects/Coding)"
];

async function main() {
  console.log('Seeding skills...');
  for (const name of skills) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log('Successfully seeded 19 skills.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
