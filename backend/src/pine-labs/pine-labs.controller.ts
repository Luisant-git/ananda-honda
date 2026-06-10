import { Controller, Post, Get, Body, Param, Put, UseGuards } from '@nestjs/common';
import { PineLabsService } from './pine-labs.service';

@Controller('pine-labs')
export class PineLabsController {
  constructor(private readonly pineLabsService: PineLabsService) {}

  @Post('initiate')
  async initiatePayment(@Body() data: any) {
    return this.pineLabsService.initiatePayment(data);
  }

  @Get('status/:transactionId')
  async checkPaymentStatus(@Param('transactionId') transactionId: string) {
    return this.pineLabsService.checkPaymentStatus(transactionId);
  }

  @Put('cancel/:transactionId')
  async cancelPayment(@Param('transactionId') transactionId: string) {
    return this.pineLabsService.cancelPayment(transactionId);
  }

  @Post('webhook')
  async processWebhook(@Body() payload: any) {
    return this.pineLabsService.processWebhook(payload);
  }
  
  @Get('transactions')
  async getTransactions() {
    return this.pineLabsService.getTransactions();
  }
}
