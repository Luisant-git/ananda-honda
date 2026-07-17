import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PineLabsConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig(type: string = 'sale') {
    const config = await this.prisma.pineLabsConfig.findFirst({
      where: { type },
    });
    return config || null;
  }

  async saveConfig(data: any) {
    const type = data.type || 'sale';
    const existing = await this.prisma.pineLabsConfig.findFirst({
      where: { type },
    });
    if (existing) {
      return this.prisma.pineLabsConfig.update({
        where: { id: existing.id },
        data: {
          merchantId: data.merchantId,
          securityToken: data.securityToken,
          clientId: data.clientId,
          storeId: data.storeId,
          hardwareSn: data.hardwareSn,
          environment: data.environment,
          status: data.status,
        },
      });
    } else {
      return this.prisma.pineLabsConfig.create({
        data: {
          type,
          merchantId: data.merchantId,
          securityToken: data.securityToken,
          clientId: data.clientId,
          storeId: data.storeId,
          hardwareSn: data.hardwareSn,
          environment: data.environment,
          status: data.status,
        },
      });
    }
  }

  async toggleStatus(status: string, type: string = 'sale') {
    const existing = await this.prisma.pineLabsConfig.findFirst({
      where: { type },
    });
    if (!existing) throw new NotFoundException('Config not found');
    
    return this.prisma.pineLabsConfig.update({
      where: { id: existing.id },
      data: { status },
    });
  }
}
