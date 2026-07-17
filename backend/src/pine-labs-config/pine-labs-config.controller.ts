import { Controller, Get, Post, Body, Put, Patch, Query } from '@nestjs/common';
import { PineLabsConfigService } from './pine-labs-config.service';

@Controller('pine-labs-config')
export class PineLabsConfigController {
  constructor(private readonly pineLabsConfigService: PineLabsConfigService) {}

  @Get()
  async getConfig(@Query('type') type?: string) {
    return this.pineLabsConfigService.getConfig(type || 'sale');
  }

  @Post()
  async saveConfig(@Body() body: any) {
    return this.pineLabsConfigService.saveConfig(body);
  }

  @Patch('status')
  async toggleStatus(@Body('status') status: string, @Body('type') type?: string) {
    return this.pineLabsConfigService.toggleStatus(status, type || 'sale');
  }
}
