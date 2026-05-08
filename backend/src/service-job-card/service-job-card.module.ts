import { Module } from '@nestjs/common';
import { ServiceJobCardService } from './service-job-card.service';
import { ServiceJobCardController } from './service-job-card.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceJobCardController],
  providers: [ServiceJobCardService, PrismaService],
})
export class ServiceJobCardModule {}
