import { Module } from '@nestjs/common';
import { ServiceJobCardService } from './service-job-card.service';
import { ServiceJobCardController } from './service-job-card.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceJobCardController],
  providers: [ServiceJobCardService],
})
export class ServiceJobCardModule {}
