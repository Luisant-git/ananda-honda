
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.serviceJobCard.findMany({
    where: {
      OR: [
        { closedDate: { lt: new Date('2024-01-01') } },
        { createdAt: { lt: new Date('2024-01-01') } }
      ]
    }
  });

  console.log(`Found ${records.length} records to shift from 2023 to 2026...`);

  let count = 0;
  for (const record of records) {
    const updateData: any = {};
    
    if (record.closedDate && record.closedDate.getFullYear() === 2023) {
      const newClosedDate = new Date(record.closedDate);
      newClosedDate.setFullYear(2026);
      updateData.closedDate = newClosedDate;
    }

    if (record.createdAt && record.createdAt.getFullYear() === 2023) {
      const newCreatedAt = new Date(record.createdAt);
      newCreatedAt.setFullYear(2026);
      updateData.createdAt = newCreatedAt;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.serviceJobCard.update({
        where: { id: record.id },
        data: updateData,
      });
      count++;
    }
  }

  console.log(`Successfully updated ${count} records.`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
