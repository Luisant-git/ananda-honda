import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class ServicePaymentCollectionService {
  private readonly logger = new Logger(ServicePaymentCollectionService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private pdfService: PdfService,
  ) {}

  async create(data: { date: string; customerId: number; totalAmt?: number; recAmt: number; paymentType: string; paymentStatus?: string; vehicleNumber?: string; paymentModeId: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string; jobCardNumber?: string }) {
    const lastPayment = await this.prisma.servicePaymentCollection.findFirst({
      orderBy: { receiptNo: 'desc' }
    });
    
    let nextNumber = 1;
    if (lastPayment && lastPayment.receiptNo) {
      const lastNumber = parseInt(lastPayment.receiptNo.replace('SRV', ''));
      nextNumber = lastNumber + 1;
    }
    const receiptNo = `SRV${nextNumber.toString().padStart(4, '0')}`;

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

    const savedPayment = await this.prisma.servicePaymentCollection.create({
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

    try {
      if (savedPayment.customer && savedPayment.customer.contactNo) {
        // Run asynchronously so it doesn't block the API response
        this.sendWhatsappReceipt(savedPayment).catch((err) => {
          this.logger.error('Failed to send WhatsApp receipt asynchronously', err);
        });
      }
    } catch (error) {
      this.logger.error('Error triggering WhatsApp receipt', error);
    }

    return savedPayment;
  }

  private async sendWhatsappReceipt(payment: any) {
  try {
    const pdfBuffer = await this.pdfService.generateServiceReceipt(payment, payment.user);
    const filename = `Service_Receipt_${payment.receiptNo}.pdf`;
    const mediaId = await this.whatsappService.uploadMedia(pdfBuffer, filename);

    const customerName = payment.customer.name;
    const contactNo = payment.customer.contactNo;
    const jobCardNumber = payment.jobCardNumber || '-';
    const amount = payment.recAmt;

    await this.whatsappService.sendServiceReceiptTemplate(
      contactNo,
      customerName,
      payment.receiptNo,
      jobCardNumber,
      amount,
      mediaId,
      filename,
    );
  } catch (error) {
    this.logger.error('Failed to send WhatsApp service receipt process', error);
  }
}

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.servicePaymentCollection.findMany({
        where: { deletedAt: null },
        include: {
          customer: true,
          paymentMode: true,
          typeOfPayment: true,
          typeOfCollection: true,
          vehicleModel: true,
          user: true,
          cancelledByUser: true
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.servicePaymentCollection.count({ where: { deletedAt: null } })
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
        user: true,
        cancelledByUser: true
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

  async cancel(id: number, cancelledBy?: number) {
    return this.prisma.servicePaymentCollection.update({
      where: { id },
      data: {
        recAmt: 0,
        cancelledAt: new Date(),
        cancelledBy: cancelledBy || null
      },
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true,
        typeOfCollection: true,
        vehicleModel: true,
        user: true,
        cancelledByUser: true
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

  const paymentModes = await this.prisma.servicePaymentMode.findMany({
    include: { serviceTypeOfPayments: true }
  });

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

    
      const types = await Promise.all(
        mode.serviceTypeOfPayments.map(async (type) => {
          const typeData = await this.prisma.servicePaymentCollection.aggregate({
            where: {
              date: { gte: startDate, lte: endDate },
              paymentModeId: mode.id,
              typeOfPaymentId: type.id,
              deletedAt: null
            },
            _sum: { recAmt: true },
            _count: true
          });

          return {
            type: type.typeOfMode,
            amount: typeData._sum.recAmt || 0,
            count: typeData._count
          };
        })
      );

      return {
        mode: mode.paymentMode,
        amount: data._sum.recAmt || 0,
        count: data._count,
        types
      };
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