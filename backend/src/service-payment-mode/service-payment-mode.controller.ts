import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ServicePaymentModeService } from './service-payment-mode.service';

@Controller('service-payment-modes')
export class ServicePaymentModeController {
  constructor(private readonly servicePaymentModeService: ServicePaymentModeService) {}

  @Post()
  create(@Body() createDto: { paymentMode: string; status: string }) {
    return this.servicePaymentModeService.create(createDto);
  }

  @Get()
  findAll() {
    return this.servicePaymentModeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicePaymentModeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: { paymentMode?: string; status?: string }) {
    return this.servicePaymentModeService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.servicePaymentModeService.remove(+id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
