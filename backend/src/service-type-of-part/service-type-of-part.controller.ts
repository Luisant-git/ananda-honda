import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';

import { ServiceTypeOfPartService } from './service-type-of-part.service';
import type { StatusType } from './service-type-of-part.service';

@Controller('service-type-of-parts')
export class ServiceTypeOfPartController {
  constructor(private readonly service: ServiceTypeOfPartService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Post('bulk')
  bulkCreate(@Body() body: { parts: any[] }) {
    return this.service.bulkCreate(body.parts);
  }

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('status') status: StatusType,
  ) {
    return this.service.findAll({ page, limit, search, status });
  }

  @Get('by-part-no/:partNo')
  findByPartNo(@Param('partNo') partNo: string) {
    return this.service.findByPartNo(partNo);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

@Patch(':id')
update(@Param('id') id: number, @Body() body: any) {
  return this.service.update(id, body);
}

  @Patch(':id/status')
  updateStatus(@Param('id') id: number, @Body() body: any) {
    return this.service.updateStatus(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}