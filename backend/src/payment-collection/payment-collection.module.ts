import { Module } from '@nestjs/common';
import { PaymentCollectionService } from './payment-collection.service';
import { PaymentCollectionController } from './payment-collection.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PrismaModule, WhatsappModule, PdfModule],
  controllers: [PaymentCollectionController],
  providers: [PaymentCollectionService],
})
export class PaymentCollectionModule {}