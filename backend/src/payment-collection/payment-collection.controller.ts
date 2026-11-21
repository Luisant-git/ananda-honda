import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PaymentCollectionService } from './payment-collection.service';
import { SalesWebhookService } from './sales-webhook.service';

@Controller(['sales-payment-collections', 'payment-collections'])
export class PaymentCollectionController {
  constructor(
    private readonly paymentCollectionService: PaymentCollectionService,
    private readonly salesWebhookService: SalesWebhookService,
  ) {}

  @Get('webhook/config')
  getWebhookConfig() {
    return this.salesWebhookService.getPublicConfig();
  }

  @Post('webhook/config')
  updateWebhookConfig(@Body() body: { url: string; secret?: string }) {
    return this.salesWebhookService.updateConfig(body.url, body.secret);
  }

  @Post('webhook/test')
  testWebhook(@Body() body?: { url?: string; secret?: string }) {
    return this.salesWebhookService.testWebhook(body?.url, body?.secret);
  }

  @Post()
  create(@Body() createPaymentCollectionDto: { date: string; customerId: number; recAmt: number; paymentModeId: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string }) {
    return this.paymentCollectionService.create(createPaymentCollectionDto);
  }

  @Get('deleted/all')
  findDeleted() {
    return this.paymentCollectionService.findDeleted();
  }

  @Get('stats/dashboard')
  getDashboardStats(@Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
    return this.paymentCollectionService.getDashboardStats(fromDate, toDate);
  }

  @Get('report')
  getReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('location') location?: string,
    @Query('status') status?: string,
    @Query('paymentModeId') paymentModeId?: string,
    @Query('typeOfPaymentId') typeOfPaymentId?: string,
    @Query('typeOfCollectionId') typeOfCollectionId?: string,
    @Query('vehicleModelId') vehicleModelId?: string,
    @Query('customerId') customerId?: string,
    @Query('salesPersonName') salesPersonName?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('export') isExport?: string,
  ) {
    return this.paymentCollectionService.getReport({
      fromDate,
      toDate,
      location,
      status,
      paymentModeId: paymentModeId ? +paymentModeId : undefined,
      typeOfPaymentId: typeOfPaymentId ? +typeOfPaymentId : undefined,
      typeOfCollectionId: typeOfCollectionId ? +typeOfCollectionId : undefined,
      vehicleModelId: vehicleModelId ? +vehicleModelId : undefined,
      customerId: customerId ? +customerId : undefined,
      salesPersonName,
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 50,
      export: isExport === 'true' || isExport === '1',
    });
  }

  @Get()
  findAll(
    @Query('page') page?: string, 
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('location') location?: string,
    @Query('status') status?: string,
    @Query('paymentModeId') paymentModeId?: string,
    @Query('typeOfPaymentId') typeOfPaymentId?: string,
    @Query('typeOfCollectionId') typeOfCollectionId?: string,
    @Query('vehicleModelId') vehicleModelId?: string,
    @Query('salesPersonName') salesPersonName?: string,
    @Query('export') isExport?: string,
    @Query('all') isAll?: string,
  ) {
    return this.paymentCollectionService.findAll({
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
      customerId: customerId ? +customerId : undefined,
      search,
      fromDate,
      toDate,
      location,
      status,
      paymentModeId: paymentModeId ? +paymentModeId : undefined,
      typeOfPaymentId: typeOfPaymentId ? +typeOfPaymentId : undefined,
      typeOfCollectionId: typeOfCollectionId ? +typeOfCollectionId : undefined,
      vehicleModelId: vehicleModelId ? +vehicleModelId : undefined,
      salesPersonName,
      export: isExport === 'true' || isAll === 'true' || isExport === '1',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentCollectionService.findOne(+id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.paymentCollectionService.restore(+id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() body: { cancelledBy?: number }) {
    return this.paymentCollectionService.cancel(+id, body.cancelledBy);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentCollectionDto: { date?: string; customerId?: number; recAmt?: number; paymentModeId?: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string }) {
    return this.paymentCollectionService.update(+id, updatePaymentCollectionDto);
  }

  @Delete('clear/all')
  clearAll() {
    return this.paymentCollectionService.clearAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body() body: { deletedBy?: number }) {
    return this.paymentCollectionService.remove(+id, body.deletedBy);
  }
}