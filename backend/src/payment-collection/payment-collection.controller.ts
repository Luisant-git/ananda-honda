import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PaymentCollectionService } from './payment-collection.service';

@Controller('payment-collections')
export class PaymentCollectionController {
  constructor(private readonly paymentCollectionService: PaymentCollectionService) {}

  @Post()
  create(@Body() createPaymentCollectionDto: { date: string; customerId: number; recAmt: number; paymentModeId: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string }) {
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
  update(@Param('id') id: string, @Body() updatePaymentCollectionDto: { date?: string; customerId?: number; recAmt?: number; paymentModeId?: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string }) {
    return this.paymentCollectionService.update(+id, updatePaymentCollectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentCollectionService.remove(+id);
  }

  @Get('stats/dashboard')
  getDashboardStats(@Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
    return this.paymentCollectionService.getDashboardStats(fromDate, toDate);
  }
}