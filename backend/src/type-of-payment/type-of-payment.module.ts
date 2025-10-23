import { Module } from '@nestjs/common';
import { TypeOfPaymentService } from './type-of-payment.service';
import { TypeOfPaymentController } from './type-of-payment.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TypeOfPaymentController],
  providers: [TypeOfPaymentService],
})
export class TypeOfPaymentModule {}