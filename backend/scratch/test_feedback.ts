import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

async function main() {
  const cls = new ClsService();
  const prisma = new PrismaService(cls);
  cls.run(async () => {
    cls.set('brand', 'BIGWINGS');
    try {
      const res = await prisma.feedbackNotificationSetting.findMany();
      console.log('Result:', res);
    } catch (err) {
      console.error('Error:', err);
    }
  });
}
main();
