import { Module } from '@nestjs/common';
import { ServiceTypeOfPaymentController } from './service-type-of-payment.controller';
import { ServiceTypeOfPaymentService } from './service-type-of-payment.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceTypeOfPaymentController],
  providers: [ServiceTypeOfPaymentService],
})
export class ServiceTypeOfPaymentModule {}
