import { Module } from '@nestjs/common';
import { ServicePaymentModeController } from './service-payment-mode.controller';
import { ServicePaymentModeService } from './service-payment-mode.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServicePaymentModeController],
  providers: [ServicePaymentModeService],
})
export class ServicePaymentModeModule {}
