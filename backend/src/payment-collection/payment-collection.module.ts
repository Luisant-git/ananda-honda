import { Module } from '@nestjs/common';
import { PaymentCollectionService } from './payment-collection.service';
import { PaymentCollectionController } from './payment-collection.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentCollectionController],
  providers: [PaymentCollectionService],
})
export class PaymentCollectionModule {}