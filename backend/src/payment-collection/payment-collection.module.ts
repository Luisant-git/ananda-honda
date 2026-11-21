import { Module } from '@nestjs/common';
import { PaymentCollectionService } from './payment-collection.service';
import { PaymentCollectionController } from './payment-collection.controller';
import { SalesWebhookService } from './sales-webhook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PrismaModule, WhatsappModule, PdfModule],
  controllers: [PaymentCollectionController],
  providers: [PaymentCollectionService, SalesWebhookService],
  exports: [PaymentCollectionService, SalesWebhookService],
})
export class PaymentCollectionModule {}