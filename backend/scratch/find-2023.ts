
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const records2023 = await prisma.serviceJobCard.findMany({
    where: {
      OR: [
        { closedDate: { lt: new Date('2024-01-01') } },
        { createdAt: { lt: new Date('2024-01-01') } }
      ]
    },
    take: 5
  });
  console.log('Records from 2023 or earlier:', records2023);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
