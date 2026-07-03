import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PdfService } from '../pdf/pdf.service';

const CLOSING_TOLERANCE_RUPEES = 2.0; // Allow a deficit of up to 2 rupees for job card closing

@Injectable()
export class ServicePaymentCollectionService {
  private readonly logger = new Logger(ServicePaymentCollectionService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private pdfService: PdfService,
  ) {}

async create(data: { 
  date: string; 
  customerId: number; 
  totalAmt?: number; 
  recAmt: number; 
  hasAdditionalPlan?: boolean;
  additionalPlanCollectionId?: number;
  additionalPlanAmount?: number;
  paymentType?: string; 
  paymentStatus?: string; 
  vehicleNumber?: string; 
  paymentModeId: number; 
  typeOfPaymentId?: number; 
  serviceTypeOfCollectionId?: number; 
  vehicleModelId?: number; 
  enteredBy?: number; 
  remarks?: string; 
  refNo?: string; 
  jobCardNumber?: string; 
  serviceTypeId?: number;
  selectedParts?: any[];
}) {
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
  let computedTotalAmt: number | null = data.totalAmt !== undefined && data.totalAmt !== null ? data.totalAmt : null;

  // Resolve vehicleNumber from job card if missing in input
  let effectiveVehicleNumber = data.vehicleNumber;
  if (!effectiveVehicleNumber && data.jobCardNumber) {
    const jobCard = await this.prisma.serviceJobCard.findUnique({
      where: { jobCardNumber: data.jobCardNumber },
      select: { registrationNumber: true }
    });
    if (jobCard) {
      effectiveVehicleNumber = jobCard.registrationNumber;
    }
  }

  // Identify the "session" where this payment belongs to compute cumulative totalAmt
  const sessionWhere: any = {
    customerId: data.customerId,
    deletedAt: null,
    cancelledAt: null,
  };

  if (data.jobCardNumber) {
    // Match existing payments for this job card 
    // OR pending payments for this vehicle (linking them to this job card session)
    sessionWhere.OR = [
      { jobCardNumber: data.jobCardNumber },
      {
        AND: [
          { vehicleNumber: effectiveVehicleNumber },
          { paymentStatus: 'pending' }
        ]
      }
    ];
  } else if (effectiveVehicleNumber) {
    // No job card yet, sum previous pending payments for this vehicle
    sessionWhere.vehicleNumber = effectiveVehicleNumber;
    sessionWhere.paymentStatus = 'pending';
  } else {
    // Fallback if neither identifier is provided
    sessionWhere.id = -1;
  }

  const previousSumAgg = await this.prisma.servicePaymentCollection.aggregate({
    where: sessionWhere,
    _sum: { recAmt: true }
  });

  const previousTotal = previousSumAgg._sum.recAmt || 0;
  computedTotalAmt = Math.round((previousTotal + data.recAmt) * 100) / 100; // Keep precise for cumulative total

  // Resolve payment type id and name (accept legacy string or id) early so status and session updates use it
  const resolvePaymentType = async () => {
    if (data.paymentType) {
      const name = String(data.paymentType).trim();
      if (name) {
        let pt = await this.prisma.paymentType.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
        if (!pt) pt = await this.prisma.paymentType.create({ data: { name, isActive: true } });
        return { id: pt.id, name: pt.name };
      }
    }
    if ((data as any).paymentTypeId) {
      const pt = await this.prisma.paymentType.findUnique({ where: { id: (data as any).paymentTypeId } });
      if (pt) return { id: pt.id, name: pt.name };
    }
    // default to 'full payment'
    let pt = await this.prisma.paymentType.findFirst({ where: { name: { equals: 'full payment', mode: 'insensitive' } } });
    if (!pt) pt = await this.prisma.paymentType.create({ data: { name: 'full payment', isActive: true } });
    return { id: pt.id, name: pt.name };
  };

  const resolvedPaymentTypeEarly = await resolvePaymentType();
  // All new payments start with 'pending' status - user must manually change to 'completed'
  let currentStatus: string;
  const normalizedResolvedName = resolvedPaymentTypeEarly.name?.toString().toLowerCase().trim();
  currentStatus = data.paymentStatus || 'pending';

  // Identify previous relevant pending payments for this vehicle session context
  const partPayments = await this.prisma.servicePaymentCollection.findMany({
    where: {
      ...sessionWhere,
      paymentStatus: 'pending',
    }
  });

  if (partPayments.length > 0) {
    const updateData: any = {};
    
    // Link old part payments to the job card if one is being provided now
    if (data.jobCardNumber) {
      updateData.jobCardNumber = data.jobCardNumber;
    }

    // If status is completed, mark all previous relevant pending payments in this session as completed
    if (currentStatus === 'completed') {
      updateData.paymentStatus = 'completed';
      paymentSessions = partPayments.map(p => ({
        receiptNo: p.receiptNo,
        date: p.date,
        amount: p.recAmt
      }));
    }

    // Do NOT change the original paymentType of previous receipts.
    // Only mark previous relevant pending payments as completed and link job card if provided.

    if (Object.keys(updateData).length > 0) {
      await this.prisma.servicePaymentCollection.updateMany({
        where: { id: { in: partPayments.map(p => p.id) } },
        data: updateData
      });
    }
  }

  // Resolve paymentType again for final save (use early result)
  const resolvedPaymentType = resolvedPaymentTypeEarly;

  const savedPayment = await this.prisma.servicePaymentCollection.create({
    data: {
      date: new Date(data.date),
      customerId: data.customerId,
      totalAmt: computedTotalAmt || null,
      recAmt: data.recAmt,
      hasAdditionalPlan: data.hasAdditionalPlan || false,
      additionalPlanCollectionId: data.additionalPlanCollectionId || null,
      additionalPlanAmount: data.additionalPlanAmount || 0,
      paymentTypeId: resolvedPaymentType.id,
      paymentType: resolvedPaymentType.name,
      paymentStatus: currentStatus,
      vehicleNumber: effectiveVehicleNumber || null,
      paymentModeId: data.paymentModeId,
      typeOfPaymentId: data.typeOfPaymentId || null,
      serviceTypeOfCollectionId: data.serviceTypeOfCollectionId || null,
      vehicleModelId: data.vehicleModelId || null,
      enteredBy: data.enteredBy || null,
      remarks: data.remarks || null,
      refNo: data.refNo || null,
      jobCardNumber: data.jobCardNumber || null,
      serviceTypeId: data.serviceTypeId || null,
      receiptNo,
      paymentSessions,
      selectedParts: data.selectedParts || []
    },
    include: {
      customer: true,
      paymentMode: true,
      typeOfPayment: true,
      serviceTypeOfCollection: true,
      vehicleModel: true,
      serviceTypeRelation: true,
      user: true,
      paymentTypeMaster: true,
      additionalPlanCollection: true
    }
  });


  // Check and update job card status - ONLY if there is an invoice amount
  if (data.jobCardNumber) {
    const jobCard = await this.prisma.serviceJobCard.findUnique({
      where: {
        jobCardNumber: data.jobCardNumber
      }
    });

    if (jobCard) {
      const invoiceAmount = jobCard.totalRevenue || 0;
      
      // CRITICAL: Only proceed if there's an invoice amount
      if (invoiceAmount > 0) {
        // Count all related payments for the same job card, same vehicle session, or this receipt.
        const totalPaid = await this.prisma.servicePaymentCollection.aggregate({
          where: {
            deletedAt: null,
            cancelledAt: null,
            OR: [
              { jobCardNumber: data.jobCardNumber },
              { customerId: data.customerId, vehicleNumber: effectiveVehicleNumber },
              { receiptNo }
            ],
            // If current payment is a full payment, include pending receipts too.
            ...(normalizedResolvedName === 'full payment' ? {} : { paymentStatus: 'completed' })
          },
          _sum: {
            recAmt: true
          }
        });

        const paidAmount = totalPaid._sum.recAmt || 0;
        
        // Close the job card if paid amount meets or exceeds invoice amount, or is within tolerance
        const isEffectivelyPaid = (paidAmount >= invoiceAmount) || (invoiceAmount - paidAmount <= CLOSING_TOLERANCE_RUPEES);

        if (isEffectivelyPaid && jobCard.status !== 'Closed') {
          await this.prisma.serviceJobCard.update({
            where: {
              jobCardNumber: data.jobCardNumber
            },
            data: {
              status: 'Closed',
              closedDate: new Date()
            }
          });

          // Mark all related pending payments as completed when the job card is auto-closed.
          await this.prisma.servicePaymentCollection.updateMany({
            where: {
              deletedAt: null,
              cancelledAt: null,
              OR: [
                { jobCardNumber: data.jobCardNumber },
                { customerId: data.customerId, vehicleNumber: effectiveVehicleNumber },
                { receiptNo }
              ],
              paymentStatus: 'pending'
            },
            data: {
              paymentStatus: 'completed'
            }
          });

          this.logger.log(`Job card ${data.jobCardNumber} closed automatically. Paid: ${paidAmount}, Invoice: ${invoiceAmount} (Tolerance: ${CLOSING_TOLERANCE_RUPEES})`);
        } else if (paidAmount < invoiceAmount) {
          this.logger.log(`Job card ${data.jobCardNumber} NOT closed. Paid: ${paidAmount}, Need: ${invoiceAmount}, Status: ${jobCard.status}`);
        }
      } else {
        // No invoice amount - job card should remain as Pending
        this.logger.log(`Job card ${data.jobCardNumber} has no invoice amount (₹0). Keeping status as Pending (not closing).`);
        
        // Ensure the job card status is Pending (not Closed)
        if (jobCard.status === 'Closed') {
          // This shouldn't happen, but if it somehow got closed, revert it
          await this.prisma.serviceJobCard.update({
            where: {
              jobCardNumber: data.jobCardNumber
            },
            data: {
              status: 'Pending',
              closedDate: null
            }
          });
          this.logger.log(`Job card ${data.jobCardNumber} was incorrectly closed. Reverted to Pending.`);
        }
      }
    }
  }

  try {
    if (savedPayment.customer && savedPayment.customer.contactNo) {
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
      const serviceType = payment.serviceTypeRelation?.name || payment.serviceType || 'N/A';

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

async completePartPayment(id: number, data: {
  recAmt?: number;
  paymentModeId?: number;
  typeOfPaymentId?: number;
  remarks?: string;
  enteredBy?: number;
}) {
  // Get the part payment record
  const partPayment = await this.prisma.servicePaymentCollection.findUnique({
    where: { id },
    include: { customer: true }
  });

  if (!partPayment) {
    throw new Error('Payment record not found');
  }

  if (partPayment.paymentStatus === 'completed') {
    throw new Error('Payment is already completed');
  }

    if ((partPayment as any).paymentTypeMaster?.name !== 'part payment') {
    throw new Error('This is not a part payment record');
  }

  // Update the part payment to completed and change type to full payment
  // Ensure there is a 'full payment' PaymentType to link to
  let fullPaymentType = await this.prisma.paymentType.findFirst({ where: { name: { equals: 'full payment', mode: 'insensitive' } } });
  if (!fullPaymentType) {
    fullPaymentType = await this.prisma.paymentType.create({ data: { name: 'full payment', isActive: true } });
  }

  const updatedPayment = await this.prisma.servicePaymentCollection.update({
    where: { id },
    data: {
      paymentStatus: 'completed',
        paymentTypeId: fullPaymentType.id,
        paymentType: fullPaymentType.name,
      recAmt: data.recAmt || partPayment.recAmt,
      paymentModeId: data.paymentModeId || partPayment.paymentModeId,
      typeOfPaymentId: data.typeOfPaymentId || partPayment.typeOfPaymentId,
      remarks: data.remarks || partPayment.remarks,
      enteredBy: data.enteredBy || partPayment.enteredBy,
    },
    include: {
      customer: true,
      paymentMode: true,
      typeOfPayment: true,
      serviceTypeOfCollection: true,
      vehicleModel: true,
      serviceTypeRelation: true,
      user: true
    }
  });

  // Send WhatsApp receipt for completed payment
  try {
    if (updatedPayment.customer && updatedPayment.customer.contactNo) {
      this.sendWhatsappReceipt(updatedPayment).catch((err) => {
        this.logger.error('Failed to send WhatsApp receipt for completed payment', err);
      });
    }
  } catch (error) {
    this.logger.error('Error triggering WhatsApp receipt for completed payment', error);
  }
   
  // Check and update job card status - ONLY if there is an invoice amount
  if (updatedPayment.jobCardNumber) {
    const jobCard = await this.prisma.serviceJobCard.findUnique({
      where: {
        jobCardNumber: updatedPayment.jobCardNumber
      }
    });

    if (jobCard) {
      const invoiceAmount = jobCard.totalRevenue || 0;
      
      // Only proceed if there's an invoice amount
      if (invoiceAmount > 0) {
        // Count all related payments for the same job card, same vehicle session, or this receipt.
        const totalPaid = await this.prisma.servicePaymentCollection.aggregate({
          where: {
            deletedAt: null,
            cancelledAt: null,
            OR: [
              { jobCardNumber: updatedPayment.jobCardNumber },
              { customerId: updatedPayment.customerId, vehicleNumber: updatedPayment.vehicleNumber },
              { receiptNo: updatedPayment.receiptNo }
            ],
            ...((updatedPayment.paymentType?.toString().toLowerCase().trim() === 'full payment') ? {} : { paymentStatus: 'completed' })
          },
          _sum: {
            recAmt: true
          }
        });

        const paidAmount = totalPaid._sum.recAmt || 0;

        // Close the job card if paid amount meets or exceeds invoice amount, or is within tolerance
        const isEffectivelyPaid = (paidAmount >= invoiceAmount) || (invoiceAmount - paidAmount <= CLOSING_TOLERANCE_RUPEES);
        if (isEffectivelyPaid && jobCard.status !== 'Closed') {
          await this.prisma.serviceJobCard.update({
            where: {
              jobCardNumber: updatedPayment.jobCardNumber
            },
            data: {
              status: 'Closed',
              closedDate: new Date()
            }
          });
          this.logger.log(`Job card ${updatedPayment.jobCardNumber} closed automatically. Paid: ${paidAmount}, Invoice: ${invoiceAmount} (Tolerance: ${CLOSING_TOLERANCE_RUPEES})`);
        }
      } else {
        this.logger.log(`Job card ${updatedPayment.jobCardNumber} has no invoice amount (₹0). Status remains ${jobCard.status}`);
      }
    }
  }
  
  return updatedPayment;
}

  async findAll(
    page: number = 1, 
    limit: number = 10, 
    customerId?: number,
    paymentType?: string, // 'full payment' | 'part payment' | 'all' (legacy)
    paymentStatus?: string // 'completed' | 'pending' | 'all'
  ) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    // Apply payment type filter
    if (paymentType && paymentType !== 'all') {
      // legacy: allow either master-linked records or string-only legacy records
      const pt = await this.prisma.paymentType.findFirst({
        where: { name: { equals: paymentType, mode: 'insensitive' } }
      });
      where.OR = [
        { paymentType: { equals: paymentType, mode: 'insensitive' } }
      ];
      if (pt) {
        where.OR.unshift({ paymentTypeId: pt.id });
      }
    }
    
    // Apply payment status filter
    if (paymentStatus && paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus;
    }
    
    const [data, total] = await Promise.all([
      this.prisma.servicePaymentCollection.findMany({
        where,
        include: {
          customer: true,
          paymentMode: true,
          typeOfPayment: true,
          serviceTypeOfCollection: true,
          vehicleModel: true,
          serviceTypeRelation: true,
          user: true,
          cancelledByUser: true,
          paymentTypeMaster: true,
          additionalPlanCollection: true
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.servicePaymentCollection.count({ where })
    ]);

    // Compute cumulative totalAmt per session (Job Card or Pending Vehicle Chain)
    const jobCardNumbers = Array.from(new Set(data
      .map(item => item.jobCardNumber)
      .filter(Boolean) as string[]));
    
    // Identifiers for pending chains (no Job Card yet)
    const pendingVehicleKeys = Array.from(new Set(data
      .filter(item => !item.jobCardNumber && item.vehicleNumber && item.paymentStatus === 'pending')
      .map(item => `${item.customerId}:${item.vehicleNumber}`)));

    const cumulativeTotalsById: Record<number, number> = {};
    const identifierOR: any[] = [];
    
    if (jobCardNumbers.length > 0) {
      identifierOR.push({ jobCardNumber: { in: jobCardNumbers } });
    }
    
    pendingVehicleKeys.forEach(key => {
      const [cid, vno] = key.split(':');
      identifierOR.push({
        customerId: +cid,
        vehicleNumber: vno,
        jobCardNumber: null,
        paymentStatus: 'pending'
      });
    });

    if (identifierOR.length > 0) {
      const allHistorical = await this.prisma.servicePaymentCollection.findMany({
        where: {
          OR: identifierOR,
          deletedAt: null,
          cancelledAt: null
        },
        orderBy: [{ date: 'asc' }, { id: 'asc' }]
      });

      const runningTotals: Record<string, number> = {};
      for (const p of allHistorical) {
        const key = p.jobCardNumber 
          ? `jc:${p.jobCardNumber}` 
          : `cv:${p.customerId}:${p.vehicleNumber}`;
        
        runningTotals[key] = Math.round(((runningTotals[key] || 0) + (p.recAmt || 0)) * 100) / 100; // Keep precise for cumulative total
        cumulativeTotalsById[p.id] = runningTotals[key];
      }
    }

    const dataWithSelectedParts = data.map(item => ({
      ...item,
      totalAmt: cumulativeTotalsById[item.id] ?? item.totalAmt,
      selectedParts: item.selectedParts || []
    }));
    
    return { data: dataWithSelectedParts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const payment = await this.prisma.servicePaymentCollection.findUnique({
      where: { id },
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true,
        serviceTypeOfCollection: true, 
        vehicleModel: true,
        serviceTypeRelation: true,
        user: true,
        cancelledByUser: true,
        paymentTypeMaster: true,
        additionalPlanCollection: true
      }
    });
    
    // Ensure selectedParts is always an array
    if (payment) {
      return {
        ...payment,
        selectedParts: payment.selectedParts || []
      };
    }
    return payment;
  }

  async update(id: number, data: { 
    date?: string; 
    customerId?: number; 
    totalAmt?: number; 
    recAmt?: number; 
    hasAdditionalPlan?: boolean;
    additionalPlanCollectionId?: number;
    additionalPlanAmount?: number;
    paymentType?: string; 
    paymentStatus?: string; 
    vehicleNumber?: string; 
    paymentModeId?: number; 
    typeOfPaymentId?: number; 
    serviceTypeOfCollectionId?: number; 
    vehicleModelId?: number; 
    enteredBy?: number; 
    remarks?: string; 
    refNo?: string; 
    jobCardNumber?: string; 
    serviceTypeId?: number;
    selectedParts?: any[];
  }) {
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    if (data.typeOfPaymentId === undefined) {
      delete updateData.typeOfPaymentId;
    }
    if (data.serviceTypeOfCollectionId === undefined) {
      delete updateData.serviceTypeOfCollectionId; 
    }
    if (data.additionalPlanCollectionId === undefined) {
      delete updateData.additionalPlanCollectionId;
    }
    if (data.vehicleModelId === undefined) {
      delete updateData.vehicleModelId;
    }
    if (data.enteredBy === undefined) {
      delete updateData.enteredBy;
    }
    if (data.serviceTypeId === undefined) {
      delete updateData.serviceTypeId;
    }
    if (data.selectedParts === undefined) {
      delete updateData.selectedParts;
    }

    return this.prisma.servicePaymentCollection.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        paymentMode: true,
        typeOfPayment: true,
        serviceTypeOfCollection: true,
        vehicleModel: true,
        serviceTypeRelation: true,
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

  async clearAll() {
    return this.prisma.servicePaymentCollection.deleteMany({});
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
        serviceTypeOfCollection: true,
        vehicleModel: true,
        serviceTypeRelation: true,
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
        serviceTypeOfCollection: true,
        vehicleModel: true,
        serviceTypeRelation: true,
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
        serviceTypeOfCollection: true,
        vehicleModel: true,
        serviceTypeRelation: true,
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

    const paymentModes = await this.prisma.servicePaymentMode.findMany({
      include: { serviceTypeOfPayments: true }
    });

    const modes = await Promise.all(
      paymentModes.map(async (mode) => {
        const data = await this.prisma.servicePaymentCollection.aggregate({
          where: {
            ...baseWhere,
            paymentModeId: mode.id
          },
          _sum: { recAmt: true },
          _count: true
        });

        const types = await Promise.all(
          mode.serviceTypeOfPayments.map(async (type) => {
            const typeData = await this.prisma.servicePaymentCollection.aggregate({
              where: {
                ...baseWhere,
                paymentModeId: mode.id,
                typeOfPaymentId: type.id
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
      where: baseWhere
    });

    return { modes, totalCount };
  }

  async getBusinessDashboardStats(fromDate: string, toDate: string) {
    try {
      const dateFilter: any = {};
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (fromDate && toDate) {
        startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.gte = startDate;
        dateFilter.lte = endDate;
      }

      const jobCardWhere: any = {};
      if (Object.keys(dateFilter).length > 0) {
        // Prioritize closedDate for reporting, fallback to createdAt if not set
        jobCardWhere.OR = [
          { closedDate: dateFilter },
          { AND: [{ closedDate: null }, { createdAt: dateFilter }] }
        ];
      }

      const jobCardsData = await this.prisma.serviceJobCard.aggregate({
        where: jobCardWhere,
        _sum: {
          labourRevenue: true,
          partsRevenue: true,
          lubesRevenue: true,
          accessoriesRevenue: true,
          totalRevenue: true,
        },
        _count: {
          _all: true
        }
      });

      const actualLabour = Math.round(jobCardsData?._sum?.labourRevenue || 0);
      const actualParts = Math.round(jobCardsData?._sum?.partsRevenue || 0);
      const actualLubes = Math.round(jobCardsData?._sum?.lubesRevenue || 0);
      const actualAccessories = Math.round(jobCardsData?._sum?.accessoriesRevenue || 0);
      const actualTotal = Math.round(jobCardsData?._sum?.totalRevenue || 0);
      const jobCardsCount = jobCardsData?._count?._all || 0;

      // Count specific items
      const [oilCount, amcCount, batteryCount, tyreCount, paintingCount] = await Promise.all([
        this.prisma.serviceJobCard.count({ where: { ...jobCardWhere, oil: true } }),
        this.prisma.serviceJobCard.count({ where: { ...jobCardWhere, amc: true } }),
        this.prisma.serviceJobCard.count({ where: { ...jobCardWhere, battery: true } }),
        this.prisma.serviceJobCard.count({ where: { ...jobCardWhere, tyre: true } }),
        this.prisma.serviceJobCard.count({ where: { ...jobCardWhere, painting: true } }),
      ]);

      // Get all job cards to build the service volume map
      const allJobCards = await this.prisma.serviceJobCard.findMany({
        where: jobCardWhere,
        include: {
          serviceType: true
        }
      });

      const receivedVolumeMap: Record<string, number> = {
        'Free 01': 0, 'Free 02': 0, 'Free 03': 0, 'Paid': 0, 'Accident Repairs': 0, 'General': 0, 'Minor': 0
      };
      const invoicedVolumeMap: Record<string, number> = { ...receivedVolumeMap };

      allJobCards.forEach(jc => {
        const stName = (jc.serviceType?.name || '').toUpperCase();
        let targetKey = 'General';
        
        if (stName.includes('FREE 01') || stName.includes('FREE 1') || stName.includes('1ST FREE')) targetKey = 'Free 01';
        else if (stName.includes('FREE 02') || stName.includes('FREE 2') || stName.includes('2ND FREE')) targetKey = 'Free 02';
        else if (stName.includes('FREE 03') || stName.includes('FREE 3') || stName.includes('3RD FREE')) targetKey = 'Free 03';
        else if (stName.includes('PAID')) targetKey = 'Paid';
        else if (stName.includes('ACCIDENT') || stName.includes('INSURANCE')) targetKey = 'Accident Repairs';
        else if (stName.includes('MINOR')) targetKey = 'Minor';

        receivedVolumeMap[targetKey]++;
        if (jc.status === 'Closed' || jc.status === 'Invoiced' || jc.closedDate) {
          invoicedVolumeMap[targetKey]++;
        }
      });

      const totalReceived = Object.values(receivedVolumeMap).reduce((a, b) => a + b, 0);
      const totalInvoiced = Object.values(invoicedVolumeMap).reduce((a, b) => a + b, 0);
      const pendingInvoiceMap: Record<string, number> = {};
      Object.keys(receivedVolumeMap).forEach(key => {
        pendingInvoiceMap[key] = receivedVolumeMap[key] - invoicedVolumeMap[key];
      });

      const dailyStatsMap = new Map();
      
      // If we have a date range, pre-fill all dates with zero
      if (startDate && endDate) {
        let current = new Date(startDate);
        while (current <= endDate) {
          const dateStr = current.toLocaleDateString('en-GB').replace(/\//g, '-');
          dailyStatsMap.set(dateStr, { date: dateStr, received: 0, pending: 0, invoiced: 0 });
          current.setDate(current.getDate() + 1);
        }
      }

      allJobCards.forEach(jc => {
        const receivedDate = jc.createdAt.toLocaleDateString('en-GB').replace(/\//g, '-');
        const closedDate = jc.closedDate ? jc.closedDate.toLocaleDateString('en-GB').replace(/\//g, '-') : null;
        
        if (!dailyStatsMap.has(receivedDate)) {
          dailyStatsMap.set(receivedDate, { date: receivedDate, received: 0, pending: 0, invoiced: 0 });
        }
        
        const stats = dailyStatsMap.get(receivedDate);
        stats.received++;
        if (jc.status === 'Pending') {
          stats.pending++;
        }
        
        if (closedDate) {
          if (!dailyStatsMap.has(closedDate)) {
            dailyStatsMap.set(closedDate, { date: closedDate, received: 0, pending: 0, invoiced: 0 });
          }
          dailyStatsMap.get(closedDate).invoiced++;
        }
      });

      const dailyTrend = Array.from(dailyStatsMap.values()).sort((a: any, b: any) => {
        const [dayA, monthA, yearA] = a.date.split('-').map(Number);
        const [dayB, monthB, yearB] = b.date.split('-').map(Number);
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
      });

      const totalVolume = jobCardsCount;
      const withoutMinorReceived = totalReceived - receivedVolumeMap['Minor'];
      const withoutMinorInvoiced = totalInvoiced - invoicedVolumeMap['Minor'];

      const today = new Date();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysCompletedActual = startDate && endDate 
        ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))) 
        : today.getDate();
      
      const daysLeft = daysInMonth - daysCompletedActual;

      // Helper for per-day and rate calculations
      const calcPerDay = (val: number) => daysCompletedActual > 0 ? parseFloat((val / daysCompletedActual).toFixed(2)) : 0;
      const calcRate = (val: number) => daysCompletedActual > 0 ? Math.round((val / daysCompletedActual) * daysInMonth) : 0;

      return {
        summary: {
          serviceVolume: totalReceived,
          labour: actualLabour,
          stdParts: actualParts,
          overallParts: actualParts + actualAccessories,
          lubrications: actualLubes,
          labourPerVehicle: totalReceived > 0 ? Math.floor(actualLabour / totalReceived) : 0,
          partsPerVehicle: totalReceived > 0 ? Math.floor(actualParts / totalReceived) : 0,
          oilCount: oilCount,
          amc: amcCount,
          battery: batteryCount,
          paintingPanels: paintingCount,
          tyre: tyreCount,
          startDate: startDate ? startDate.toLocaleDateString('en-GB').replace(/\//g, '-') : 'All Time',
          todaysDate: today.toLocaleDateString('en-GB').replace(/\//g, '-'),
          reportDate: endDate ? endDate.toLocaleDateString('en-GB').replace(/\//g, '-') : 'All Time',
          daysCompleted: daysCompletedActual,
          daysLeft: daysLeft > 0 ? daysLeft : 0,
          daysInMonth: daysInMonth,
        },
        serviceVolume: [
          { type: 'Data For the Month', free01: '', free02: '', free03: '', paid: '', accidentRepairs: '', general: '', minor: '', total: '', withoutMinor: '' },
          { type: 'Target For the Month', free01: '', free02: '', free03: '', paid: '', accidentRepairs: '', general: '', minor: '', total: '', withoutMinor: '' },
          { type: 'Received Vehicles', free01: receivedVolumeMap['Free 01'], free02: receivedVolumeMap['Free 02'], free03: receivedVolumeMap['Free 03'], paid: receivedVolumeMap['Paid'], accidentRepairs: receivedVolumeMap['Accident Repairs'], general: receivedVolumeMap['General'], minor: receivedVolumeMap['Minor'], total: totalReceived, withoutMinor: withoutMinorReceived },
          { type: 'Invoice Pending', free01: pendingInvoiceMap['Free 01'], free02: pendingInvoiceMap['Free 02'], free03: pendingInvoiceMap['Free 03'], paid: pendingInvoiceMap['Paid'], accidentRepairs: pendingInvoiceMap['Accident Repairs'], general: pendingInvoiceMap['General'], minor: pendingInvoiceMap['Minor'], total: totalReceived - totalInvoiced, withoutMinor: withoutMinorReceived - withoutMinorInvoiced },
          { type: 'Invoiced Vehicles', free01: invoicedVolumeMap['Free 01'], free02: invoicedVolumeMap['Free 02'], free03: invoicedVolumeMap['Free 03'], paid: invoicedVolumeMap['Paid'], accidentRepairs: invoicedVolumeMap['Accident Repairs'], general: invoicedVolumeMap['General'], minor: invoicedVolumeMap['Minor'], total: totalInvoiced, withoutMinor: withoutMinorInvoiced },
          { type: 'Per Day Invoice', free01: calcPerDay(invoicedVolumeMap['Free 01']), free02: calcPerDay(invoicedVolumeMap['Free 02']), free03: calcPerDay(invoicedVolumeMap['Free 03']), paid: calcPerDay(invoicedVolumeMap['Paid']), accidentRepairs: calcPerDay(invoicedVolumeMap['Accident Repairs']), general: calcPerDay(invoicedVolumeMap['General']), minor: calcPerDay(invoicedVolumeMap['Minor']), total: calcPerDay(totalInvoiced), withoutMinor: calcPerDay(withoutMinorInvoiced) },
          { type: 'Volume Service Rate', 
            free01: Math.round(invoicedVolumeMap['Free 01'] + calcPerDay(invoicedVolumeMap['Free 01'])), 
            free02: Math.round(invoicedVolumeMap['Free 02'] + calcPerDay(invoicedVolumeMap['Free 02'])), 
            free03: Math.round(invoicedVolumeMap['Free 03'] + calcPerDay(invoicedVolumeMap['Free 03'])), 
            paid: Math.round(invoicedVolumeMap['Paid'] + calcPerDay(invoicedVolumeMap['Paid'])), 
            accidentRepairs: Math.round(invoicedVolumeMap['Accident Repairs'] + calcPerDay(invoicedVolumeMap['Accident Repairs'])), 
            general: Math.round(invoicedVolumeMap['General'] + calcPerDay(invoicedVolumeMap['General'])), 
            minor: Math.round(invoicedVolumeMap['Minor'] + calcPerDay(invoicedVolumeMap['Minor'])), 
            total: Math.round(totalInvoiced + calcPerDay(totalInvoiced)), 
            withoutMinor: Math.round(withoutMinorInvoiced + calcPerDay(withoutMinorInvoiced)) 
          },
        ],
        incomeTargetCount: [
          { particulars: '3 months Average Sale', battery: 0, tyre: 0, amc: 0, painting: 0 },
          { particulars: 'Target', battery: 0, tyre: 0, amc: 0, painting: 0 },
          { particulars: 'Achieved No', battery: batteryCount, tyre: tyreCount, amc: amcCount, painting: paintingCount },
          { particulars: 'Per Day Count Achieved', battery: calcPerDay(batteryCount), tyre: calcPerDay(tyreCount), amc: calcPerDay(amcCount), painting: calcPerDay(paintingCount) },
          { particulars: 'Current Rate for the month', battery: calcRate(batteryCount), tyre: calcRate(tyreCount), amc: calcRate(amcCount), painting: calcRate(paintingCount) },
        ],
        incomeParameters: [
          { particulars: 'Last 3 Months Average Achieve', serviceVolume: 0, labour: 0, std: 0, overallParts: 0, lubrication: 0, battery: 0, batteryJet: 0, tyre: 0, amc: 0, carbonCleaner: 0, healthCard: 0, painting: 0, oilRevenue: 0 },
          { particulars: 'Target', serviceVolume: 0, labour: 0, std: 0, overallParts: 0, lubrication: 0, battery: 0, batteryJet: 0, tyre: 0, amc: 0, carbonCleaner: 0, healthCard: 0, painting: 0, oilRevenue: 0 },
          { particulars: 'Achieved', serviceVolume: totalVolume, labour: actualLabour, std: actualParts, overallParts: actualParts + actualAccessories, lubrication: actualLubes, battery: batteryCount, batteryJet: 0, tyre: tyreCount, amc: amcCount, carbonCleaner: 0, healthCard: 0, painting: paintingCount, oilRevenue: actualLubes },
          { particulars: 'Per Day', serviceVolume: calcPerDay(totalVolume), labour: calcPerDay(actualLabour), std: calcPerDay(actualParts), overallParts: calcPerDay(actualParts + actualAccessories), lubrication: calcPerDay(actualLubes), battery: calcPerDay(batteryCount), batteryJet: 0, tyre: calcPerDay(tyreCount), amc: calcPerDay(amcCount), carbonCleaner: 0, healthCard: 0, painting: calcPerDay(paintingCount), oilRevenue: calcPerDay(actualLubes) },
          { particulars: 'Rate for the month', serviceVolume: calcRate(totalVolume), labour: calcRate(actualLabour), std: calcRate(actualParts), overallParts: calcRate(actualParts + actualAccessories), lubrication: calcRate(actualLubes), battery: calcRate(batteryCount), batteryJet: 0, tyre: calcRate(tyreCount), amc: calcRate(amcCount), carbonCleaner: 0, healthCard: 0, painting: calcRate(paintingCount), oilRevenue: calcRate(actualLubes) },
        ],
        dailyTrend: dailyTrend
      };
    } catch (error) {
      this.logger.error('Error in getBusinessDashboardStats', error.stack);
      throw error;
    }
  }
}