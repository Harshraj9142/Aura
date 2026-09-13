const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apiKey = await prisma.apiKey.findFirst({
    include: { user: true }
  });
  console.log(JSON.stringify(apiKey, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
