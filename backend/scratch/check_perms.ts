import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const perms = await prisma.menuPermission.findMany();
  console.log(perms.map(p => p.role));
}

main().finally(() => prisma.$disconnect());
