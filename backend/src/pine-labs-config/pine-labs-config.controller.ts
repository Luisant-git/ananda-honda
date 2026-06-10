import { Controller, Get, Post, Body, Put, Patch } from '@nestjs/common';
import { PineLabsConfigService } from './pine-labs-config.service';

@Controller('pine-labs-config')
export class PineLabsConfigController {
  constructor(private readonly pineLabsConfigService: PineLabsConfigService) {}

  @Get()
  async getConfig() {
    return this.pineLabsConfigService.getConfig();
  }

  @Post()
  async saveConfig(@Body() body: any) {
    return this.pineLabsConfigService.saveConfig(body);
  }

  @Patch('status')
  async toggleStatus(@Body('status') status: string) {
    return this.pineLabsConfigService.toggleStatus(status);
  }
}
