import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.serviceJobCard.findMany({
    take: 50,
    orderBy: { id: 'desc' },
  });

  console.log('Total Job Cards:', await prisma.serviceJobCard.count());
  console.log('Painting = true count:', await prisma.serviceJobCard.count({ where: { painting: true } }));
  console.log('Battery = true count:', await prisma.serviceJobCard.count({ where: { battery: true } }));
  console.log('Tyre = true count:', await prisma.serviceJobCard.count({ where: { tyre: true } }));
  console.log('AMC = true count:', await prisma.serviceJobCard.count({ where: { amc: true } }));
  console.log('Oil = true count:', await prisma.serviceJobCard.count({ where: { oil: true } }));

  console.log('\nSample Cards:');
  console.log(cards.map(c => ({
    jobCardNumber: c.jobCardNumber,
    customerName: c.customerName,
    oil: c.oil,
    amc: c.amc,
    battery: c.battery,
    tyre: c.tyre,
    painting: c.painting
  })).slice(0, 10));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
