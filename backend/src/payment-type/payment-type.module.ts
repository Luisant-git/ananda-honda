import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentTypeController } from './payment-type.controller';
import { PaymentTypeService } from './payment-type.service';

@Module({
imports: [PrismaModule],
  controllers: [PaymentTypeController],
  providers: [PaymentTypeService],
  exports: [PaymentTypeService]
})
export class PaymentTypeModule {}
