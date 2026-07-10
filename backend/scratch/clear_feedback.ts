import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`DELETE FROM "FeedbackNotificationSetting"`);
  console.log("Cleared FeedbackNotificationSetting table.");
}
main().finally(() => prisma.$disconnect());
