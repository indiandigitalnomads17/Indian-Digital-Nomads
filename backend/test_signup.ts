const { default: prisma } = require('./src/config/prisma.ts');

async function main() {
  try {
    await prisma.user.create({
      data: {
        email: "test_signup2@example.com",
        fullName: "Test User",
        passwordHash: "dummy",
        role: "CLIENT",
        profile: { create: {} }
      }
    });
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
