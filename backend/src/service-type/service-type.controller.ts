import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';

import { ServiceTypeService } from './service-type.service';

@Controller('service-types')
export class ServiceTypeController {
  constructor(private readonly service: ServiceTypeService) {}

  // GET ALL
  @Get()
  getAll(@Query('search') search?: string) {
    return this.service.getAll(search);
  }

  // CREATE
  @Post()
  create(@Body() body: { name: string; status?: string }) {
    return this.service.create(body);
  }

  // UPDATE
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; status?: string },
  ) {
    return this.service.update(Number(id), body);
  }

  // GET ONE
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  // DELETE
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }

  // CLEAR ALL
  @Delete('clear/all')
  clearAll() {
    return this.service.clearAll();
  }
}