import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TypeOfPaymentService } from './type-of-payment.service';

@Controller('type-of-payments')
export class TypeOfPaymentController {
  constructor(private readonly typeOfPaymentService: TypeOfPaymentService) {}

  @Post()
  create(@Body() createTypeOfPaymentDto: { paymentModeId: number; typeOfMode: string }) {
    return this.typeOfPaymentService.create(createTypeOfPaymentDto);
  }

  @Get()
  findAll() {
    return this.typeOfPaymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typeOfPaymentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTypeOfPaymentDto: { paymentModeId?: number; typeOfMode?: string }) {
    return this.typeOfPaymentService.update(+id, updateTypeOfPaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typeOfPaymentService.remove(+id);
  }
}