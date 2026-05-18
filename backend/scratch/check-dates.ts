
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.serviceJobCard.groupBy({
    by: ['status'],
    _count: true,
  });
  console.log('Status counts:', counts);

  const dates = await prisma.serviceJobCard.findMany({
    select: {
      createdAt: true,
      closedDate: true,
    },
    take: 5,
  });
  console.log('Sample dates:', dates);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
