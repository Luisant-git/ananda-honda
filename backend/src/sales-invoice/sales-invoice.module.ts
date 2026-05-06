import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { SalesInvoiceController } from './sales-invoice.controller';
import { SalesInvoiceService } from './sales-invoice.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
  ],
  controllers: [SalesInvoiceController],
  providers: [SalesInvoiceService],
  exports: [SalesInvoiceService],
})
export class SalesInvoiceModule {}
