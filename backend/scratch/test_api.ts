import { PrismaClient } from '@prisma/client';
import { ServicePaymentCollectionService } from '../src/service-payment-collection/service-payment-collection.service';

const prisma = new PrismaClient() as any;
const mockWhatsapp = {} as any;
const mockPdf = {} as any;

async function run() {
  const service = new ServicePaymentCollectionService(prisma, mockWhatsapp, mockPdf);
  const data = await service.getBusinessDashboardStats('2026-04-01', '2026-05-16');
  console.log("Trend for range:");
  console.log(data.dailyTrend.filter((t: any) => t.date === '16-05-2026'));
}

run().catch(console.error).finally(() => prisma.$disconnect());
