import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentCollectionService } from './payment-collection.service';

@Controller('payment-collections')
export class PaymentCollectionController {
  constructor(private readonly paymentCollectionService: PaymentCollectionService) {}

  @Post()
  create(@Body() createPaymentCollectionDto: { date: string; customerId: number; recAmt: number; paymentModeId: number; typeOfPaymentId?: number; remarks: string }) {
    return this.paymentCollectionService.create(createPaymentCollectionDto);
  }

  @Get()
  findAll() {
    return this.paymentCollectionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentCollectionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentCollectionDto: { date?: string; customerId?: number; recAmt?: number; paymentModeId?: number; typeOfPaymentId?: number; remarks?: string }) {
    return this.paymentCollectionService.update(+id, updatePaymentCollectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentCollectionService.remove(+id);
  }
}