import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        username: {
          in: ['Ragul1', 'admin123', 'testuser', 'Ragul']
        }
      }
    });
    console.log(`Deleted ${deleted.count} users successfully.`);
  } catch (e) {
    console.error('Error deleting users:', e);
  }
}

main().finally(() => prisma.$disconnect());
