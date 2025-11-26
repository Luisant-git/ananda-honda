import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceTypeOfPaymentService {
  constructor(private prisma: PrismaService) {}

  async create(data: { paymentModeId: number; typeOfMode: string }) {
    return this.prisma.serviceTypeOfPayment.create({ data });
  }

  async findAll() {
    return this.prisma.serviceTypeOfPayment.findMany({
      include: { paymentMode: true },
      orderBy: { id: 'asc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.serviceTypeOfPayment.findUnique({
      where: { id },
      include: { paymentMode: true }
    });
  }

  async update(id: number, data: { paymentModeId?: number; typeOfMode?: string }) {
    return this.prisma.serviceTypeOfPayment.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.serviceTypeOfPayment.delete({ where: { id } });
  }
}
