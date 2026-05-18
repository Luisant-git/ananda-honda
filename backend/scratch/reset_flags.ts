import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting all boolean flags (oil, amc, battery, tyre, painting) to false for all service job cards...');
  const res = await prisma.serviceJobCard.updateMany({
    data: {
      oil: false,
      amc: false,
      battery: false,
      tyre: false,
      painting: false
    }
  });
  console.log(`Successfully reset flags for ${res.count} records!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
