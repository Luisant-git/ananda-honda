import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentTypeService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; isActive: boolean }) {
    const normalized = {
      name: data.name?.toString().trim(),
      isActive: data.isActive
    };
    // Ensure consistent casing to avoid case-variant duplicates
    normalized.name = normalized.name;
    return this.prisma.paymentType.create({ data: normalized });
  }

  async findAll() {
    return this.prisma.paymentType.findMany({ orderBy: { id: 'desc' } });
  }

  async findOne(id: number) {
    return this.prisma.paymentType.findUnique({ where: { id } });
  }

  async update(id: number, data: { name?: string; isActive?: boolean }) {
    const normalized: any = {};
    if (data.name !== undefined) normalized.name = data.name?.toString().trim();
    if (data.isActive !== undefined) normalized.isActive = data.isActive;
    return this.prisma.paymentType.update({ where: { id }, data: normalized });
  }

  async remove(id: number) {
    // Prevent deletion if in use
    const usageCount = await this.prisma.servicePaymentCollection.count({ where: { paymentTypeId: id } });
    if (usageCount > 0) {
      throw new Error('Cannot delete payment type that is in use');
    }
    return this.prisma.paymentType.delete({ where: { id } });
  }
}
