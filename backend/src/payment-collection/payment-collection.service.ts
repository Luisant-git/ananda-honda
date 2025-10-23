import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentCollectionService {
  constructor(private prisma: PrismaService) {}

  async create(data: { date: string; customerId: number; recAmt: number; paymentModeId: number; typeOfPaymentId?: number; remarks: string }) {
    const lastPayment = await this.prisma.paymentCollection.findFirst({
      orderBy: { id: 'desc' }
    });
    
    const nextId = lastPayment ? lastPayment.id + 1 : 1;
    const receiptNo = `RV${nextId.toString().padStart(4, '0')}`;

    return this.prisma.paymentCollection.create({
      data: {
        ...data,
        date: new Date(data.date),
        receiptNo,
        typeOfPaymentId: data.typeOfPaymentId || null
      },
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true
      }
    });
  }

  async findAll() {
    return this.prisma.paymentCollection.findMany({
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true
      },
      orderBy: { id: 'desc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.paymentCollection.findUnique({
      where: { id },
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true
      }
    });
  }

  async update(id: number, data: { date?: string; customerId?: number; recAmt?: number; paymentModeId?: number; typeOfPaymentId?: number; remarks?: string }) {
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    if (data.typeOfPaymentId === undefined) {
      delete updateData.typeOfPaymentId;
    }

    return this.prisma.paymentCollection.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true
      }
    });
  }

  async remove(id: number) {
    return this.prisma.paymentCollection.delete({
      where: { id }
    });
  }
}