
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sampleClosed = await prisma.serviceJobCard.findMany({
    where: { status: 'Closed' },
    select: {
      closedDate: true,
    },
    take: 10,
  });
  console.log('Sample closed dates:', sampleClosed);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
