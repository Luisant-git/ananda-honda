import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentModeService {
  constructor(private prisma: PrismaService) {}

  async create(data: { paymentMode: string; status: string }) {
    return this.prisma.paymentMode.create({
      data
    });
  }

  async findAll() {
    return this.prisma.paymentMode.findMany({
      orderBy: { id: 'desc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.paymentMode.findUnique({
      where: { id }
    });
  }

  async update(id: number, data: { paymentMode?: string; status?: string }) {
    return this.prisma.paymentMode.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    // Check if payment mode has type of payments
    const typeOfPaymentCount = await this.prisma.typeOfPayment.count({
      where: { paymentModeId: id }
    });
    
    if (typeOfPaymentCount > 0) {
      throw new Error('Cannot delete payment mode with existing type of payment records');
    }
    
    return this.prisma.paymentMode.delete({
      where: { id }
    });
  }
}