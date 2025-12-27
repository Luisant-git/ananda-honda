import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ServicePaymentCollectionService } from './service-payment-collection.service';

@Controller('service-payment-collections')
export class ServicePaymentCollectionController {
  constructor(private readonly servicePaymentCollectionService: ServicePaymentCollectionService) {}

  @Post()
  create(@Body() createServicePaymentCollectionDto: { date: string; customerId: number; totalAmt?: number; recAmt: number; paymentType: string; paymentStatus?: string; vehicleNumber?: string; paymentModeId: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string; jobCardNumber?: string }) {
    return this.servicePaymentCollectionService.create(createServicePaymentCollectionDto);
  }

  @Get('deleted/all')
  findDeleted() {
    return this.servicePaymentCollectionService.findDeleted();
  }

  @Get('stats/dashboard')
  getDashboardStats(@Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
    return this.servicePaymentCollectionService.getDashboardStats(fromDate, toDate);
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.servicePaymentCollectionService.findAll(page ? +page : 1, limit ? +limit : 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicePaymentCollectionService.findOne(+id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.servicePaymentCollectionService.restore(+id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() body: { cancelledBy?: number }) {
    return this.servicePaymentCollectionService.cancel(+id, body.cancelledBy);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServicePaymentCollectionDto: { date?: string; customerId?: number; totalAmt?: number; recAmt?: number; paymentType?: string; paymentStatus?: string; vehicleNumber?: string; paymentModeId?: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string; jobCardNumber?: string }) {
    return this.servicePaymentCollectionService.update(+id, updateServicePaymentCollectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body() body: { deletedBy?: number }) {
    return this.servicePaymentCollectionService.remove(+id, body.deletedBy);
  }
}