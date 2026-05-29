import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Testing Prisma query...");
    try {
        const businesses = await prisma.user.findMany({
            where: {
              role: UserRole.CLIENT, 
              status: 'ACTIVE',
              profile: {
                isNot: null,
                latitude: { not: null },
                longitude: { not: null }
              }
            },
            select: {
              id: true,
              fullName: true,
              profile: {
                select: { latitude: true, longitude: true }
              },
              reviewsRec: { select: { rating: true } },
              _count: { select: { jobsAsClient: { where: { status: "OPEN" } } } }
            }
        });
        console.log("Query success. Businesses count:", businesses.length);
    } catch (err) {
        console.error("Prisma error:", err);
    }
    
    await prisma.$disconnect();
}

main();
