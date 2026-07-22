import { PrismaClient } from '@prisma/client';
import { ServiceJobCardService } from '../src/service-job-card/service-job-card.service';

const prisma = new PrismaClient() as any;
const mockWhatsapp = {} as any;

async function run() {
  const service = new ServiceJobCardService(prisma, mockWhatsapp);
  try {
    const data = await service.findAll('');
    console.log(`Successfully fetched ${data.length} records`);
  } catch (error) {
    console.error('Error in findAll:', error);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
