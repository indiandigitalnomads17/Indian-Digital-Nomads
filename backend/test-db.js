const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.job.findMany({ select: { id: true, title: true, videoUrl: true } })
  .then(jobs => { console.log(JSON.stringify(jobs, null, 2)); prisma.$disconnect(); });
