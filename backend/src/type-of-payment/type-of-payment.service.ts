import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TypeOfPaymentService {
  constructor(private prisma: PrismaService) {}

  async create(data: { paymentModeId: number; typeOfMode: string }) {
    return this.prisma.typeOfPayment.create({
      data,
      include: { paymentMode: true }
    });
  }

  async findAll() {
    return this.prisma.typeOfPayment.findMany({
      include: { paymentMode: true },
      orderBy: { id: 'desc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.typeOfPayment.findUnique({
      where: { id },
      include: { paymentMode: true }
    });
  }

  async update(id: number, data: { paymentModeId?: number; typeOfMode?: string }) {
    return this.prisma.typeOfPayment.update({
      where: { id },
      data,
      include: { paymentMode: true }
    });
  }

  async remove(id: number) {
    return this.prisma.typeOfPayment.delete({
      where: { id }
    });
  }
}