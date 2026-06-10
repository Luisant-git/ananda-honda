import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PineLabsConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    const config = await this.prisma.pineLabsConfig.findFirst();
    return config || null;
  }

  async saveConfig(data: any) {
    const existing = await this.prisma.pineLabsConfig.findFirst();
    if (existing) {
      return this.prisma.pineLabsConfig.update({
        where: { id: existing.id },
        data: {
          merchantId: data.merchantId,
          terminalId: data.terminalId,
          apiKey: data.apiKey,
          apiSecret: data.apiSecret,
          environment: data.environment,
          status: data.status,
        },
      });
    } else {
      return this.prisma.pineLabsConfig.create({
        data: {
          merchantId: data.merchantId,
          terminalId: data.terminalId,
          apiKey: data.apiKey,
          apiSecret: data.apiSecret,
          environment: data.environment,
          status: data.status,
        },
      });
    }
  }

  async toggleStatus(status: string) {
    const existing = await this.prisma.pineLabsConfig.findFirst();
    if (!existing) throw new NotFoundException('Config not found');
    
    return this.prisma.pineLabsConfig.update({
      where: { id: existing.id },
      data: { status },
    });
  }
}
