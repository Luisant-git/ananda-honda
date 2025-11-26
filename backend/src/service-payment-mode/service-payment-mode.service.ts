import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicePaymentModeService {
  constructor(private prisma: PrismaService) {}

  async create(data: { paymentMode: string; status: string }) {
    return this.prisma.servicePaymentMode.create({ data });
  }

  async findAll() {
    return this.prisma.servicePaymentMode.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    return this.prisma.servicePaymentMode.findUnique({ where: { id } });
  }

  async update(id: number, data: { paymentMode?: string; status?: string }) {
    return this.prisma.servicePaymentMode.update({ where: { id }, data });
  }

  async remove(id: number) {
    const hasRelations = await this.prisma.servicePaymentCollection.count({ where: { paymentModeId: id } });
    if (hasRelations > 0) {
      throw new Error('Cannot delete payment mode with existing service payment collections');
    }
    return this.prisma.servicePaymentMode.delete({ where: { id } });
  }
}
