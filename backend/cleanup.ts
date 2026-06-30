import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const keepTxns = ['TXN1782813292654644', 'TXN1782812890407832'];
  
  console.log('Cleaning up old Pine Labs test transactions...');
  console.log('Keeping only these transactions:', keepTxns);
  
  const result = await prisma.paymentTransaction.deleteMany({
    where: {
      transactionId: {
        notIn: keepTxns
      }
    }
  });

  console.log(`✅ Successfully deleted ${result.count} old transactions.`);
}

main()
  .catch(e => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
