import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentTypeService } from './payment-type.service';

@Controller('payment-types')
export class PaymentTypeController {
  constructor(private readonly paymentTypeService: PaymentTypeService) {}

  @Post()
  create(@Body() createDto: { name: string; isActive: boolean }) {
    return this.paymentTypeService.create(createDto);
  }

  @Get()
  findAll() {
    return this.paymentTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentTypeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: { name?: string; isActive?: boolean }) {
    return this.paymentTypeService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.paymentTypeService.remove(+id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
