import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceTypeOfPaymentService } from './service-type-of-payment.service';

@Controller('service-type-of-payments')
export class ServiceTypeOfPaymentController {
  constructor(private readonly serviceTypeOfPaymentService: ServiceTypeOfPaymentService) {}

  @Post()
  create(@Body() createDto: { paymentModeId: number; typeOfMode: string }) {
    return this.serviceTypeOfPaymentService.create(createDto);
  }

  @Get()
  findAll() {
    return this.serviceTypeOfPaymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceTypeOfPaymentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: { paymentModeId?: number; typeOfMode?: string }) {
    return this.serviceTypeOfPaymentService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceTypeOfPaymentService.remove(+id);
  }
}
