
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const devPerm = await prisma.menuPermission.findUnique({ where: { role: 'DEVELOPER' } });
  if (devPerm) {
    const permissions = devPerm.permissions;
    if (permissions.master && !permissions.master.service_type) {
      permissions.master.service_type = { add: true, edit: true, delete: true };
      await prisma.menuPermission.update({
        where: { role: 'DEVELOPER' },
        data: { permissions }
      });
      console.log('Updated DEVELOPER permissions with service_type');
    } else {
      console.log('DEVELOPER already has service_type or no master section');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
