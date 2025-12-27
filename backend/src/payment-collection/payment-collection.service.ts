import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentCollectionService {
  constructor(private prisma: PrismaService) {}

  async create(data: { date: string; customerId: number; recAmt: number; paymentModeId: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string }) {
    const lastPayment = await this.prisma.paymentCollection.findFirst({
      orderBy: { receiptNo: 'desc' }
    });
    
    let nextNumber = 1;
    if (lastPayment && lastPayment.receiptNo) {
      const lastNumber = parseInt(lastPayment.receiptNo.replace('RV', ''));
      nextNumber = lastNumber + 1;
    }
    const receiptNo = `RV${nextNumber.toString().padStart(4, '0')}`;

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

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.paymentCollection.findMany({
        where: { deletedAt: null },
        include: {
          customer: true,
          paymentMode: true,
          typeOfPayment: true,
          typeOfCollection: true,
          vehicleModel: true,
          user: true
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.paymentCollection.count({ where: { deletedAt: null } })
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  async remove(id: number, deletedBy?: number) {
    return this.prisma.paymentCollection.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || null
      }
    });
  }

  async restore(id: number) {
    return this.prisma.paymentCollection.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null
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

  async findDeleted() {
    return this.prisma.paymentCollection.findMany({
      where: { deletedAt: { not: null } },
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true,
        typeOfCollection: true,
        vehicleModel: true,
        user: true,
        deletedByUser: true
      },
      orderBy: { deletedAt: 'desc' }
    });
  }

  async getDashboardStats(fromDate: string, toDate: string) {
    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    const paymentModes = await this.prisma.paymentMode.findMany();

    const modes = await Promise.all(
      paymentModes.map(async (mode) => {
        const data = await this.prisma.paymentCollection.aggregate({
          where: { 
            date: { gte: startDate, lte: endDate }, 
            paymentModeId: mode.id,
            deletedAt: null
          },
          _sum: { recAmt: true },
          _count: true
        });
        return { mode: mode.paymentMode, amount: data._sum.recAmt || 0, count: data._count };
      })
    );

    const totalCount = await this.prisma.paymentCollection.count({
      where: { 
        date: { gte: startDate, lte: endDate },
        deletedAt: null
      }
    });

    return { modes, totalCount };
  }
}