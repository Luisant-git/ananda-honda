import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.serviceJobCard.findMany({
    select: { id: true, jobCardNumber: true, createdAt: true, closedDate: true }
  });
  
  const dateCounts: Record<string, number> = {};
  for (const c of cards) {
    if (c.closedDate) {
      const d = c.closedDate.toISOString().split('T')[0];
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    }
  }
  
  console.log("Count by closedDate:", dateCounts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
