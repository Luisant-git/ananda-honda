import { Module } from '@nestjs/common';
import { PaymentModeService } from './payment-mode.service';
import { PaymentModeController } from './payment-mode.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentModeController],
  providers: [PaymentModeService],
})
export class PaymentModeModule {}