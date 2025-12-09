import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicePaymentCollectionService {
  constructor(private prisma: PrismaService) {}

  async create(data: { date: string; customerId: number; totalAmt?: number; recAmt: number; paymentType: string; paymentStatus?: string; vehicleNumber?: string; paymentModeId: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string; jobCardNumber?: string }) {
    const lastPayment = await this.prisma.servicePaymentCollection.findFirst({
      orderBy: { id: 'desc' }
    });
    
    const nextId = lastPayment ? lastPayment.id + 1 : 1;
    const receiptNo = `SRV${nextId.toString().padStart(4, '0')}`;

    let paymentSessions: any[] = [];

    // If status is completed, mark all previous pending payments as completed
    if (data.paymentStatus === 'completed') {
      const partPayments = await this.prisma.servicePaymentCollection.findMany({
        where: {
          customerId: data.customerId,
          paymentStatus: 'pending',
          deletedAt: null
        }
      });

      if (partPayments.length > 0) {
        paymentSessions = partPayments.map(p => ({
          receiptNo: p.receiptNo,
          date: p.date,
          amount: p.recAmt
        }));

        await this.prisma.servicePaymentCollection.updateMany({
          where: {
            id: { in: partPayments.map(p => p.id) }
          },
          data: { paymentStatus: 'completed' }
        });
      }
    }

    return this.prisma.servicePaymentCollection.create({
      data: {
        ...data,
        date: new Date(data.date),
        receiptNo,
        paymentStatus: data.paymentStatus || 'completed',
        totalAmt: data.totalAmt || null,
        vehicleNumber: data.vehicleNumber || null,
        typeOfPaymentId: data.typeOfPaymentId || null,
        typeOfCollectionId: data.typeOfCollectionId || null,
        vehicleModelId: data.vehicleModelId || null,
        enteredBy: data.enteredBy || null,
        jobCardNumber: data.jobCardNumber || null,
        paymentSessions
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
    return this.prisma.servicePaymentCollection.findMany({
      where: { deletedAt: null },
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
    return this.prisma.servicePaymentCollection.findUnique({
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

  async update(id: number, data: { date?: string; customerId?: number; totalAmt?: number; recAmt?: number; paymentType?: string; paymentStatus?: string; vehicleNumber?: string; paymentModeId?: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string; jobCardNumber?: string }) {
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

    return this.prisma.servicePaymentCollection.update({
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
    return this.prisma.servicePaymentCollection.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || null
      }
    });
  }

  async restore(id: number) {
    return this.prisma.servicePaymentCollection.update({
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
    return this.prisma.servicePaymentCollection.findMany({
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

    const paymentModes = await this.prisma.servicePaymentMode.findMany();

    const modes = await Promise.all(
      paymentModes.map(async (mode) => {
        const data = await this.prisma.servicePaymentCollection.aggregate({
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

    const totalCount = await this.prisma.servicePaymentCollection.count({
      where: { 
        date: { gte: startDate, lte: endDate },
        deletedAt: null
      }
    });

    return { modes, totalCount };
  }
}