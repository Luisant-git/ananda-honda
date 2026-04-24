import { Module } from '@nestjs/common';
import { ServicePaymentCollectionService } from './service-payment-collection.service';
import { ServicePaymentCollectionController } from './service-payment-collection.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PrismaModule, WhatsappModule, PdfModule],
  controllers: [ServicePaymentCollectionController],
  providers: [ServicePaymentCollectionService],
})
export class ServicePaymentCollectionModule {}