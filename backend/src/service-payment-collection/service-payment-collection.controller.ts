import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ServicePaymentCollectionService } from './service-payment-collection.service';

@Controller('service-payment-collections')
export class ServicePaymentCollectionController {
  constructor(private readonly servicePaymentCollectionService: ServicePaymentCollectionService) {}

  @Post()
  create(@Body() createServicePaymentCollectionDto: { date: string; customerId: number; recAmt: number; paymentModeId: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string; jobCardNumber?: string }) {
    return this.servicePaymentCollectionService.create(createServicePaymentCollectionDto);
  }

  @Get()
  findAll() {
    return this.servicePaymentCollectionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicePaymentCollectionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServicePaymentCollectionDto: { date?: string; customerId?: number; recAmt?: number; paymentModeId?: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string; jobCardNumber?: string }) {
    return this.servicePaymentCollectionService.update(+id, updateServicePaymentCollectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body() body: { deletedBy?: number }) {
    return this.servicePaymentCollectionService.remove(+id, body.deletedBy);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.servicePaymentCollectionService.restore(+id);
  }

  @Get('deleted/all')
  findDeleted() {
    return this.servicePaymentCollectionService.findDeleted();
  }

  @Get('stats/dashboard')
  getDashboardStats(@Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
    return this.servicePaymentCollectionService.getDashboardStats(fromDate, toDate);
  }
}