import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Phase 1: Minimal seed placeholder.
  // Seed fixtures and demo data will be implemented in subsequent phases.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
