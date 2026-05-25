// prisma/add-admin.ts
import dotenv from 'dotenv';
dotenv.config();

import argon2 from 'argon2';

async function main() {
  const { default: prisma } = await import('../src/config/prisma');

  console.log('⏳ Generating secure admin credentials via Argon2...');
  const passwordHash = await argon2.hash('AdminPassword123');

  console.log('⏳ Syncing Administrative account record onto the database...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@localgigs.com' },
    update: {
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      passwordHash: passwordHash
    },
    create: {
      email: 'admin@localgigs.com',
      fullName: 'Root System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      isVerified: true,
      nomadScore: 100.00,
      passwordHash: passwordHash,
    },
  });

  console.log('✨ Success! Test admin account registered natively:', admin.email);
}

main()
  .catch((e) => {
    console.error('❌ Data sync execution crashed:', e);
    process.exit(1);
  });