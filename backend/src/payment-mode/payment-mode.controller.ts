import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentModeService } from './payment-mode.service';

@Controller('payment-modes')
export class PaymentModeController {
  constructor(private readonly paymentModeService: PaymentModeService) {}

  @Post()
  create(@Body() createPaymentModeDto: { paymentMode: string; status: string }) {
    return this.paymentModeService.create(createPaymentModeDto);
  }

  @Get()
  findAll() {
    return this.paymentModeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentModeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentModeDto: { paymentMode?: string; status?: string }) {
    return this.paymentModeService.update(+id, updatePaymentModeDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.paymentModeService.remove(+id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}