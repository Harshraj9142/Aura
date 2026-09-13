const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.user.updateMany({
    data: { role: 'GOVERNMENT' },
  });
  console.log('Updated all users to GOVERNMENT');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
