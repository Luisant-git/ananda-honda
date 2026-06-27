import { Module } from '@nestjs/common';
import { ServiceJobCardService } from './service-job-card.service';
import { ServiceJobCardController } from './service-job-card.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, WhatsappModule],
  controllers: [ServiceJobCardController],
  providers: [ServiceJobCardService],
})
export class ServiceJobCardModule {}
