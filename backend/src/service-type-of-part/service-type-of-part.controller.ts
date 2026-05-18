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
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ServiceTypeOfPartService } from './service-type-of-part.service';

@Controller('service-type-of-parts')
export class ServiceTypeOfPartController {
  constructor(private readonly serviceTypeOfPartService: ServiceTypeOfPartService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: { partNo: string; partDescription: string; status?: string }) {
    return this.serviceTypeOfPartService.create(body);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreate(@Body() body: { parts: Array<{ partNo: string; partDescription: string; status?: string }> }) {
    return this.serviceTypeOfPartService.bulkCreate(body.parts);
  }

  @Get()
  findAll() {
    return this.serviceTypeOfPartService.findAll();
  }

  @Get('enabled')
  getEnabledParts() {
    return this.serviceTypeOfPartService.getEnabledParts();
  }

  @Get('by-status')
  getPartsByStatus(@Query('status') status: string) {
    return this.serviceTypeOfPartService.getPartsByStatus(status);
  }

  @Get('by-part-no/:partNo')
  findByPartNo(@Param('partNo') partNo: string) {
    return this.serviceTypeOfPartService.findByPartNo(partNo);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceTypeOfPartService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { partNo?: string; partDescription?: string; status?: string }
  ) {
    return this.serviceTypeOfPartService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.serviceTypeOfPartService.remove(id);
    return { message: 'Service part deleted successfully' };
  }
}