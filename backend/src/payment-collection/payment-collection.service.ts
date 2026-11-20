import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PdfService } from '../pdf/pdf.service';

export interface PaymentCollectionFilterDto {
  page?: number;
  limit?: number;
  customerId?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  location?: string;
  status?: string; // 'all' | 'success' | 'active' | 'cancelled'
  paymentModeId?: number;
  typeOfPaymentId?: number;
  typeOfCollectionId?: number;
  vehicleModelId?: number;
  salesPersonName?: string;
  export?: boolean;
}

@Injectable()
export class PaymentCollectionService {
  private readonly logger = new Logger(PaymentCollectionService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private pdfService: PdfService,
  ) {}

  private buildWhereClause(filter: PaymentCollectionFilterDto = {}, extra?: any) {
    const andConditions: any[] = [{ deletedAt: null }];

    // Status filter
    if (filter.status) {
      const s = filter.status.toLowerCase().trim();
      if (s === 'cancelled') {
        andConditions.push({ cancelledAt: { not: null } });
      } else if (s === 'success' || s === 'active') {
        andConditions.push({ cancelledAt: null });
      }
    }

    // Date range filter
    if (filter.fromDate || filter.toDate) {
      const dateCondition: any = {};
      if (filter.fromDate) {
        const start = new Date(filter.fromDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          dateCondition.gte = start;
        }
      }
      if (filter.toDate) {
        const end = new Date(filter.toDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          dateCondition.lte = end;
        }
      }
      if (Object.keys(dateCondition).length > 0) {
        andConditions.push({ date: dateCondition });
      }
    }

    // Customer ID filter
    if (filter.customerId) {
      andConditions.push({ customerId: filter.customerId });
    }

    // Customer Location filter
    if (filter.location && filter.location.trim()) {
      andConditions.push({
        customer: {
          location: { contains: filter.location.trim(), mode: 'insensitive' },
        },
      });
    }

    // Payment Mode filter
    if (filter.paymentModeId) {
      andConditions.push({ paymentModeId: filter.paymentModeId });
    }

    // Type of Payment filter
    if (filter.typeOfPaymentId) {
      andConditions.push({ typeOfPaymentId: filter.typeOfPaymentId });
    }

    // Type of Collection filter
    if (filter.typeOfCollectionId) {
      andConditions.push({ typeOfCollectionId: filter.typeOfCollectionId });
    }

    // Vehicle Model filter
    if (filter.vehicleModelId) {
      andConditions.push({ vehicleModelId: filter.vehicleModelId });
    }

    // Sales Person / Executive filter
    if (filter.salesPersonName && filter.salesPersonName.trim()) {
      const salesTerm = filter.salesPersonName.trim();
      andConditions.push({
        OR: [
          { customer: { assignedExecutive: { contains: salesTerm, mode: 'insensitive' } } },
          { user: { username: { contains: salesTerm, mode: 'insensitive' } } }
        ]
      });
    }

    // Search keyword
    if (filter.search && filter.search.trim()) {
      const term = filter.search.trim();
      andConditions.push({
        OR: [
          { receiptNo: { contains: term, mode: 'insensitive' } },
          { customer: { name: { contains: term, mode: 'insensitive' } } },
          { customer: { contactNo: { contains: term, mode: 'insensitive' } } },
          { customer: { custId: { contains: term, mode: 'insensitive' } } },
          { customer: { assignedExecutive: { contains: term, mode: 'insensitive' } } },
          { vehicleModel: { model: { contains: term, mode: 'insensitive' } } },
          { refNo: { contains: term, mode: 'insensitive' } },
          { remarks: { contains: term, mode: 'insensitive' } },
          { user: { username: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }

    if (extra) {
      if (Array.isArray(extra)) {
        andConditions.push(...extra);
      } else {
        andConditions.push(extra);
      }
    }

    return andConditions.length === 1 ? andConditions[0] : { AND: andConditions };
  }

  async create(data: { date: string; customerId: number; recAmt: number; paymentType?: string; paymentModeId: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string; pineLabsTxnId?: string }) {
    const lastPayment = await this.prisma.paymentCollection.findFirst({
      orderBy: { id: 'desc' }
    });

    let nextNumber = 1;
    if (lastPayment && lastPayment.receiptNo) {
      const lastNumber = parseInt(lastPayment.receiptNo.replace('RV', ''));
      nextNumber = lastNumber + 1;
    }
    const receiptNo = `RV${nextNumber.toString().padStart(4, '0')}`;

    const { pineLabsTxnId, ...cleanData } = data as any;

    const savedPayment = await this.prisma.paymentCollection.create({
      data: {
        ...cleanData,
        date: new Date(cleanData.date),
        receiptNo,
        paymentType: cleanData.paymentType || 'booking',
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
      const pdfBuffer = await this.pdfService.generateSalesReceipt(payment, payment.user);
      const filename = `Receipt_${payment.receiptNo}.pdf`;
      const mediaId = await this.whatsappService.uploadMedia(pdfBuffer, filename);
      
      const customerName = payment.customer.name;
      const amount = `₹${payment.recAmt}`;
      const contactNo = payment.customer.contactNo;
      const purpose = payment.typeOfCollection?.typeOfCollect || 'Sales Payment';

      await this.whatsappService.sendPaymentReceiptTemplate(
        contactNo,
        customerName,
        payment.receiptNo,
        amount,
        purpose,
        mediaId,
        filename
      );
      this.logger.log(`WhatsApp receipt sent successfully to ${contactNo}`);
    } catch (error) {
      this.logger.error('Failed to send WhatsApp receipt process', error);
    }
  }

  async getReport(filter: PaymentCollectionFilterDto = {}) {
    const whereClause = this.buildWhereClause(filter);

    const isExport = filter.export === true;
    const limit = isExport ? 20000 : Math.min(filter.limit || 50, 5000);
    const page = filter.page || 1;
    const skip = isExport ? 0 : (page - 1) * limit;

    const includeRelations = {
      customer: true,
      paymentMode: true,
      typeOfPayment: true,
      typeOfCollection: true,
      vehicleModel: true,
      user: {
        select: { id: true, username: true, role: true }
      },
      cancelledByUser: {
        select: { id: true, username: true, role: true }
      }
    };

    const successWhere = this.buildWhereClause({ ...filter, status: undefined }, { cancelledAt: null });
    const cancelledWhere = this.buildWhereClause({ ...filter, status: undefined }, { cancelledAt: { not: null } });

    const [
      data,
      totalCount,
      totalAgg,
      successAgg,
      cancelledAgg,
      modeGroups,
      collectionGroups
    ] = await Promise.all([
      this.prisma.paymentCollection.findMany({
        where: whereClause,
        include: includeRelations,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.paymentCollection.count({ where: whereClause }),
      this.prisma.paymentCollection.aggregate({
        where: whereClause,
        _sum: { recAmt: true },
      }),
      this.prisma.paymentCollection.aggregate({
        where: successWhere,
        _count: true,
        _sum: { recAmt: true },
      }),
      this.prisma.paymentCollection.aggregate({
        where: cancelledWhere,
        _count: true,
        _sum: { recAmt: true },
      }),
      this.prisma.paymentCollection.groupBy({
        by: ['paymentModeId'],
        where: successWhere,
        _sum: { recAmt: true },
        _count: true,
      }),
      this.prisma.paymentCollection.groupBy({
        by: ['typeOfCollectionId'],
        where: successWhere,
        _sum: { recAmt: true },
        _count: true,
      }),
    ]);

    const modeIds = modeGroups.map((g) => g.paymentModeId).filter(Boolean);
    const paymentModes = modeIds.length > 0
      ? await this.prisma.paymentMode.findMany({ where: { id: { in: modeIds } } })
      : [];
    const modeMap = new Map(paymentModes.map((m) => [m.id, m.paymentMode]));

    const modeBreakdown = modeGroups.map((g) => ({
      paymentModeId: g.paymentModeId,
      paymentMode: modeMap.get(g.paymentModeId) || 'Unknown',
      amount: g._sum.recAmt || 0,
      count: g._count,
    }));

    const colIds = collectionGroups.map((g) => g.typeOfCollectionId).filter((id): id is number => id !== null);
    const collectionTypes = colIds.length > 0
      ? await this.prisma.typeOfCollection.findMany({ where: { id: { in: colIds } } })
      : [];
    const colMap = new Map(collectionTypes.map((c) => [c.id, c.typeOfCollect]));

    const collectionTypeBreakdown = collectionGroups.map((g) => ({
      typeOfCollectionId: g.typeOfCollectionId,
      typeOfCollection: g.typeOfCollectionId ? colMap.get(g.typeOfCollectionId) || 'Unknown' : 'Unassigned',
      amount: g._sum.recAmt || 0,
      count: g._count,
    }));

    // Explicitly attach Sales Person Names to each payment record
    const formattedData = data.map((payment) => {
      const salesPersonName = payment.customer?.assignedExecutive?.trim() || payment.user?.username?.trim() || 'Not Assigned';
      const salesExecutive = payment.customer?.assignedExecutive?.trim() || 'Not Assigned';
      const enteredBy = payment.user?.username || 'N/A';
      return {
        ...payment,
        salesPersonName,
        salesExecutive,
        enteredBy,
      };
    });

    // Compute sales executive breakdown
    const executiveMap = new Map<string, { salesPersonName: string; amount: number; count: number }>();
    formattedData.forEach((item) => {
      if (!item.cancelledAt) {
        const name = item.salesPersonName;
        const key = name.toLowerCase();
        const existing = executiveMap.get(key);
        if (existing) {
          existing.amount = Math.round((existing.amount + item.recAmt) * 100) / 100;
          existing.count += 1;
        } else {
          executiveMap.set(key, {
            salesPersonName: name,
            amount: Math.round(item.recAmt * 100) / 100,
            count: 1,
          });
        }
      }
    });
    const salesExecutiveBreakdown = Array.from(executiveMap.values()).sort((a, b) => b.amount - a.amount);

    const totalPages = isExport ? 1 : Math.ceil(totalCount / limit);

    return {
      summary: {
        totalRecords: totalCount,
        totalAmount: totalAgg._sum.recAmt || 0,
        successRecords: successAgg._count || 0,
        successAmount: successAgg._sum.recAmt || 0,
        cancelledRecords: cancelledAgg._count || 0,
        cancelledAmount: cancelledAgg._sum.recAmt || 0,
        netCollectedAmount: successAgg._sum.recAmt || 0,
        salesExecutiveBreakdown,
        modeBreakdown,
        collectionTypeBreakdown,
      },
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        isExport,
      },
      data: formattedData,
    };
  }

  async findAll(
    pageOrOptions: number | PaymentCollectionFilterDto = 1,
    limit: number = 10,
    customerId?: number,
    search?: string,
    extraOptions?: Partial<PaymentCollectionFilterDto>
  ) {
    let options: PaymentCollectionFilterDto;

    if (typeof pageOrOptions === 'object') {
      options = pageOrOptions;
    } else {
      options = {
        page: pageOrOptions,
        limit,
        customerId,
        search,
        ...extraOptions
      };
    }

    const isExport = options.export === true || (options as any).all === true || (options.limit !== undefined && options.limit >= 5000);
    const safeLimit = isExport ? 50000 : Math.min(options.limit || 10, 50000);
    const page = isExport ? 1 : (options.page || 1);
    const skip = isExport ? 0 : (page - 1) * safeLimit;
    const whereClause = this.buildWhereClause(options);

    const [data, total] = await Promise.all([
      this.prisma.paymentCollection.findMany({
        where: whereClause,
        include: {
          customer: true,
          paymentMode: true,
          typeOfPayment: true,
          typeOfCollection: true,
          vehicleModel: true,
          user: {
            select: { id: true, username: true, role: true }
          },
          cancelledByUser: {
            select: { id: true, username: true, role: true }
          }
        },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip,
        take: safeLimit
      }),
      this.prisma.paymentCollection.count({ where: whereClause })
    ]);

    const formattedData = data.map((payment) => ({
      ...payment,
      salesPersonName: payment.customer?.assignedExecutive?.trim() || payment.user?.username?.trim() || 'Not Assigned',
      salesExecutive: payment.customer?.assignedExecutive?.trim() || 'Not Assigned',
      enteredBy: payment.user?.username || 'N/A',
    }));

    return { data: formattedData, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
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
        user: true,
        cancelledByUser: true
      }
    });
  }

  async update(id: number, data: { date?: string; customerId?: number; recAmt?: number; paymentType?: string; paymentModeId?: number; typeOfPaymentId?: number; typeOfCollectionId?: number; vehicleModelId?: number; enteredBy?: number; remarks?: string; refNo?: string }) {
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    if (data.paymentType === undefined) {
      delete updateData.paymentType;
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

  async clearAll() {
    return this.prisma.paymentCollection.deleteMany({});
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

  async cancel(id: number, cancelledBy?: number) {
    return this.prisma.paymentCollection.update({
      where: { id },
      data: {
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
    const dateFilter: any = {};
    if (fromDate && toDate) {
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      
      dateFilter.gte = startDate;
      dateFilter.lte = endDate;
    }

    const baseWhere: any = { deletedAt: null };
    if (Object.keys(dateFilter).length > 0) {
      baseWhere.date = dateFilter;
    }

    const paymentModes = await this.prisma.paymentMode.findMany({
      include: {
        typeOfPayments: true
      }
    });

    const modes = await Promise.all(
      paymentModes.map(async (mode) => {
        const data = await this.prisma.paymentCollection.aggregate({
          where: {
            ...baseWhere,
            paymentModeId: mode.id,
          },
          _sum: { recAmt: true },
          _count: true
        });

        const types = await Promise.all(
          mode.typeOfPayments.map(async (type) => {
            const typeData = await this.prisma.paymentCollection.aggregate({
              where: {
                ...baseWhere,
                paymentModeId: mode.id,
                typeOfPaymentId: type.id,
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

    const totalCount = await this.prisma.paymentCollection.count({
      where: baseWhere
    });

    return { modes, totalCount };
  }
}