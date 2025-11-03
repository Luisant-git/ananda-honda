import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentCollectionService {
  constructor(private prisma: PrismaService) {}

  async create(data: { date: string; customerId: number; recAmt: number; paymentModeId: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string }) {
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
        typeOfPaymentId: data.typeOfPaymentId || null,
        typeOfCollectionId: data.typeOfCollectionId || null,
        vehicleModelId: data.vehicleModelId || null,
        enteredBy: data.enteredBy || null
      },
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true,
        typeOfCollection: true,
        vehicleModel: true,
        user: true
      }
    });
  }

  async findAll() {
    return this.prisma.paymentCollection.findMany({
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true,
        typeOfCollection: true,
        vehicleModel: true,
        user: true
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
        typeOfPayment: true,
        typeOfCollection: true,
        vehicleModel: true,
        user: true
      }
    });
  }

  async update(id: number, data: { date?: string; customerId?: number; recAmt?: number; paymentModeId?: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string }) {
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    if (data.typeOfPaymentId === undefined) {
      delete updateData.typeOfPaymentId;
    }
    if (data.typeOfCollectionId === undefined) {
      delete updateData.typeOfCollectionId;
    }
    if (data.vehicleModelId === undefined) {
      delete updateData.vehicleModelId;
    }
    if (data.enteredBy === undefined) {
      delete updateData.enteredBy;
    }

    return this.prisma.paymentCollection.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true,
        typeOfCollection: true,
        vehicleModel: true,
        user: true
      }
    });
  }

  async remove(id: number) {
    return this.prisma.paymentCollection.delete({
      where: { id }
    });
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentModes = await this.prisma.paymentMode.findMany();

    // Current day
    const dayModes = await Promise.all(
      paymentModes.map(async (mode) => {
        const data = await this.prisma.paymentCollection.aggregate({
          where: { date: { gte: today, lt: tomorrow }, paymentModeId: mode.id },
          _sum: { recAmt: true }
        });
        return { mode: mode.paymentMode, amount: data._sum.recAmt || 0 };
      })
    );

    // Current week (Sunday to Saturday)
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekModes = await Promise.all(
      paymentModes.map(async (mode) => {
        const data = await this.prisma.paymentCollection.aggregate({
          where: { date: { gte: weekStart, lte: weekEnd }, paymentModeId: mode.id },
          _sum: { recAmt: true }
        });
        return { mode: mode.paymentMode, amount: data._sum.recAmt || 0 };
      })
    );

    // Current month (1st to end of month)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthModes = await Promise.all(
      paymentModes.map(async (mode) => {
        const data = await this.prisma.paymentCollection.aggregate({
          where: { date: { gte: monthStart, lte: monthEnd }, paymentModeId: mode.id },
          _sum: { recAmt: true }
        });
        return { mode: mode.paymentMode, amount: data._sum.recAmt || 0 };
      })
    );

    return {
      day: { date: today.toISOString().split('T')[0], modes: dayModes },
      week: { period: `${weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`, modes: weekModes },
      month: { period: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }), modes: monthModes }
    };
  }
}