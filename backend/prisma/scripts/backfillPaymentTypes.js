const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill of PaymentType master and linking ServicePaymentCollection...');

  // Get distinct paymentType strings from existing service payments
  const distinct = await prisma.servicePaymentCollection.findMany({
    distinct: ['paymentType'],
    select: { paymentType: true },
  });

  const existingNames = (await prisma.paymentType.findMany({ select: { name: true } })).map(p => p.name);

  const mapping = {};

  for (const row of distinct) {
    const raw = row.paymentType || 'UNKNOWN';
    const name = String(raw).trim();
    if (!name) continue;

    if (existingNames.includes(name)) {
      const p = await prisma.paymentType.findUnique({ where: { name } });
      mapping[name] = p.id;
      console.log(`PaymentType already exists: "${name}" -> id ${p.id}`);
      continue;
    }

    const created = await prisma.paymentType.create({ data: { name, isActive: true } });
    mapping[name] = created.id;
    console.log(`Created PaymentType: "${name}" -> id ${created.id}`);
  }

  // Now update service payment collections in batches
  const BATCH = 1000;
  let updatedTotal = 0;

  for (const [name, id] of Object.entries(mapping)) {
    const where = { paymentType: name };
    const data = { paymentTypeId: id };
    const res = await prisma.servicePaymentCollection.updateMany({ where, data });
    updatedTotal += res.count;
    console.log(`Updated ${res.count} rows setting paymentTypeId=${id} for paymentType="${name}"`);
  }

  console.log(`Backfill completed. Total rows updated: ${updatedTotal}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
