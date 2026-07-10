import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database to fix old roles...');

  const validRoles = [
    'SUPER_ADMIN',
    'ADMIN',
    'DEVELOPER',
    'ACCOUNTS',
    'PART_EXECUTIVE',
    'BILLING_EXECUTIVE',
    'CASHIER_SALES',
    'CASHIER_SERVICE'
  ];

  const validRolesList = validRoles.map(r => `'${r}'`).join(', ');

  try {
    // 1. Update old users to ADMIN
    await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "role" = 'ADMIN'
      WHERE "role"::text NOT IN (${validRolesList});
    `);
    console.log('✅ Successfully updated old users to ADMIN role.');

    // 2. Delete invalid MenuPermission entries
    await prisma.$executeRawUnsafe(`
      DELETE FROM "MenuPermission"
      WHERE "role"::text NOT IN (${validRolesList});
    `);
    console.log('✅ Successfully deleted invalid MenuPermission entries.');

    // 3. Delete invalid FeedbackNotificationSetting entries
    await prisma.$executeRawUnsafe(`
      DELETE FROM "FeedbackNotificationSetting"
      WHERE "role"::text NOT IN (${validRolesList});
    `);
    console.log('✅ Successfully deleted invalid FeedbackNotificationSetting entries.');

    console.log('\nAll done! You can now run `npx prisma db push`');
  } catch (e) {
    console.error('Error fixing roles:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
