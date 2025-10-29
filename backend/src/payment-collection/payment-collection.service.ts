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
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Last 7 days data
    const last7Days: { date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayData = await this.prisma.paymentCollection.aggregate({
        where: {
          date: {
            gte: date,
            lt: nextDay
          }
        },
        _sum: { recAmt: true }
      });
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        amount: dayData._sum.recAmt || 0
      });
    }

    // Last 12 months data
    const last12Months: { month: string; amount: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const monthData = await this.prisma.paymentCollection.aggregate({
        where: {
          date: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        _sum: { recAmt: true }
      });
      
      last12Months.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        amount: monthData._sum.recAmt || 0
      });
    }

    // Last 5 years data
    const last5Years: { year: string; amount: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const yearStart = new Date(today.getFullYear() - i, 0, 1);
      const yearEnd = new Date(today.getFullYear() - i + 1, 0, 1);
      
      const yearData = await this.prisma.paymentCollection.aggregate({
        where: {
          date: {
            gte: yearStart,
            lt: yearEnd
          }
        },
        _sum: { recAmt: true }
      });
      
      last5Years.push({
        year: yearStart.getFullYear().toString(),
        amount: yearData._sum.recAmt || 0
      });
    }

    return {
      dayWise: last7Days,
      monthWise: last12Months,
      yearWise: last5Years
    };
  }
}