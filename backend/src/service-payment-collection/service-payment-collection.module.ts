import { Module } from '@nestjs/common';
import { ServicePaymentCollectionService } from './service-payment-collection.service';
import { ServicePaymentCollectionController } from './service-payment-collection.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServicePaymentCollectionController],
  providers: [ServicePaymentCollectionService],
})
export class ServicePaymentCollectionModule {}