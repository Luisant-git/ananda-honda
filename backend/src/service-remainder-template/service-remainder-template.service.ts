import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ServiceRemainderTemplateService {
  private readonly logger = new Logger(ServiceRemainderTemplateService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  


async sendTestReminder(data: {
  customerName: string;
  phoneNumber: string;
  vehicleModel: string;
  registrationNo: string;
  serviceNumber?: number;
}) {
  try {
    await this.whatsappService.sendServiceReminderTemplate(
      data.phoneNumber,
      data.customerName,
      data.vehicleModel,
      data.registrationNo,
      data.serviceNumber?.toString() || '1'  // Send only the number
    );
    
    this.logger.log(`Test reminder sent to ${data.phoneNumber}`);
    return { success: true, message: 'Test reminder sent successfully' };
  } catch (error) {
    this.logger.error(`Failed to send test reminder: ${error.message}`);
    throw error;
  }
}

// In service-remainder-template.service.ts
async getAllReminders(filters?: {
  status?: string;
  serviceType?: string;
  fromDate?: Date;
  toDate?: Date;
  invoiceId?: number;
  limit?: number;
}) {
  const where: any = {};
  
  // If status filter is provided, use it
  if (filters?.status) {
    where.status = filters.status;
  } else {
    // Default: Only show SENT and FAILED (no future pending)
    where.status = {
      in: ['SENT', 'FAILED']
    };
  }
  
  if (filters?.serviceType) {
    where.serviceType = filters.serviceType;
  }
  
  if (filters?.invoiceId) {
    where.salesInvoiceId = filters.invoiceId;
  }
  
  if (filters?.fromDate || filters?.toDate) {
    where.scheduledDate = {};
    if (filters?.fromDate) {
      where.scheduledDate.gte = filters.fromDate;
    }
    if (filters?.toDate) {
      where.scheduledDate.lte = filters.toDate;
    }
  }
  
  const reminders = await this.prisma.serviceReminderLog.findMany({
    where,
    include: {
      salesInvoice: true  // Always include salesInvoice
    },
    orderBy: { sentAt: 'desc' },
    take: filters?.limit
  });
  
  // Ensure every reminder has a salesInvoice object (even if null)
  return reminders.map(reminder => ({
    ...reminder,
    salesInvoice: reminder.salesInvoice || {
      customerName: 'N/A',
      contactInfo: 'N/A',
      vehicleModel: 'N/A',
      vehicleRegNo: 'N/A'
    }
  }));
}
  async getReminderById(id: number) {
    const reminder = await this.prisma.serviceReminderLog.findUnique({
      where: { id },
      include: { salesInvoice: true }
    });
    
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
    
    return reminder;
  }

  async getRemindersByInvoice(invoiceId: number) {
    return this.prisma.serviceReminderLog.findMany({
      where: { salesInvoiceId: invoiceId },
      include: { salesInvoice: true },
      orderBy: { scheduledDate: 'desc' }
    });
  }

  async getUpcomingReminders(days: number = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.prisma.serviceReminderLog.findMany({
      where: {
        status: 'PENDING',
        scheduledDate: {
          gte: today,
          lte: futureDate
        }
      },
      include: {
        salesInvoice: true
      },
      orderBy: { scheduledDate: 'asc' }
    });
  }

 async getReminderSummary() {
  const [sent, failed] = await Promise.all([
    this.prisma.serviceReminderLog.count({ where: { status: 'SENT' } }),
    this.prisma.serviceReminderLog.count({ where: { status: 'FAILED' } })
  ]);
  
  const remindersByType = await this.prisma.serviceReminderLog.groupBy({
    by: ['serviceType', 'status'],
    where: {
      status: { in: ['SENT', 'FAILED'] }
    },
    _count: true
  });
  
  return {
    total: { 
      sent, 
      failed, 
      total: sent + failed 
    },
    byType: remindersByType
  };
}
  // ==================== REMINDER LOG MANAGEMENT ====================

  async createReminderLog(data: {
    salesInvoiceId: number;
    serviceType: string;
    reminderNumber: number;
    reminderDate: Date;
    scheduledDate: Date;
  }) {
    return this.prisma.serviceReminderLog.create({
      data: {
        salesInvoiceId: data.salesInvoiceId,
        serviceType: data.serviceType,
        reminderNumber: data.reminderNumber,
        reminderDate: data.reminderDate,
        scheduledDate: data.scheduledDate,
        status: 'PENDING'
      },
      include: { salesInvoice: true }
    });
  }

  async updateReminderLogStatus(id: number, status: string, errorMessage?: string) {
    return this.prisma.serviceReminderLog.update({
      where: { id },
      data: {
        status,
        sentAt: new Date(),
        errorMessage: errorMessage
      }
    });
  }

  async deleteReminderLog(id: number) {
    await this.getReminderById(id);
    return this.prisma.serviceReminderLog.delete({ where: { id } });
  }

  async resendReminder(id: number) {
    const reminder = await this.getReminderById(id);
    
    await this.prisma.serviceReminderLog.update({
      where: { id },
      data: {
        status: 'PENDING',
        scheduledDate: new Date(),
        errorMessage: null
      }
    });
    
    await this.sendReminder(reminder);
    return { success: true, message: 'Reminder resent successfully' };
  }

  // ==================== AUTOMATIC REMINDER SCHEDULING ====================

@Cron('0 9 * * *')
async createReminders() {
  this.logger.log('Creating service reminders...');
  
  const invoices = await this.prisma.salesInvoice.findMany({
    where: { actualDeliverDate: { not: null } }
  });
  
  this.logger.log(`Found ${invoices.length} invoices with delivery dates`);
  
  for (const invoice of invoices) {
    if (!invoice.actualDeliverDate) continue;
    const deliveryDate = new Date(invoice.actualDeliverDate);
    this.logger.log(`Processing invoice ${invoice.id} with delivery date ${deliveryDate}`);
    
    await this.createServiceReminder(invoice.id, deliveryDate, 'FREE_SERVICE_1', 15);
    await this.createServiceReminder(invoice.id, deliveryDate, 'FREE_SERVICE_2', 180);
    await this.createServiceReminder(invoice.id, deliveryDate, 'FREE_SERVICE_3', 365);
  }
  
  this.logger.log('Reminder creation completed');
}

  private async createServiceReminder(invoiceId: number, deliveryDate: Date, serviceType: string, daysAfter: number) {
    const serviceDate = new Date(deliveryDate);
    serviceDate.setDate(serviceDate.getDate() + daysAfter);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (serviceDate >= today) {
      const existingReminders = await this.prisma.serviceReminderLog.findMany({
        where: { salesInvoiceId: invoiceId, serviceType }
      });
      
      for (let i = 1; i <= 2; i++) {
        if (!existingReminders.find(r => r.reminderNumber === i)) {
          const reminderDate = new Date(serviceDate);
          reminderDate.setDate(reminderDate.getDate() - 5);
          const actualReminderDate = i === 2 
            ? new Date(serviceDate.setDate(serviceDate.getDate() - 3))
            : reminderDate;
          
          if (actualReminderDate >= today) {
            await this.prisma.serviceReminderLog.create({
              data: {
                salesInvoiceId: invoiceId,
                serviceType,
                reminderNumber: i,
                reminderDate: serviceDate,
                scheduledDate: actualReminderDate,
                status: 'PENDING'
              }
            });
            this.logger.log(`Created ${serviceType} reminder ${i} for invoice ${invoiceId}`);
          }
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sendDueReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueReminders = await this.prisma.serviceReminderLog.findMany({
      where: {
        status: 'PENDING',
        scheduledDate: { gte: today, lt: tomorrow }
      },
      include: { salesInvoice: true }
    });
    
    for (const reminder of dueReminders) {
      await this.sendReminder(reminder);
    }
  }

  @Cron('0 */6 * * *')
  async retryFailedReminders() {
    const failedReminders = await this.prisma.serviceReminderLog.findMany({
      where: {
        status: 'FAILED',
        sentAt: { lte: new Date(Date.now() - 6 * 60 * 60 * 1000) }
      },
      include: { salesInvoice: true }
    });
    
    for (const reminder of failedReminders) {
      await this.sendReminder(reminder);
    }
  }

 
// In service-remainder-template.service.ts
private async sendReminder(reminder: any) {
  try {
    const customer = await this.prisma.customer.findFirst({
      where: { contactNo: reminder.salesInvoice.contactInfo }
    });
    
    if (!customer || !customer.contactNo) {
      this.logger.error(`No customer found for contact ${reminder.salesInvoice.contactInfo}`);
      await this.updateReminderLogStatus(reminder.id, 'FAILED', 'Customer not found');
      return;
    }
    
    // Send ONLY the number (1, 2, or 3) - NO "Free Service" text
    const serviceNumber = reminder.serviceType === 'FREE_SERVICE_1' ? '1' :
                         reminder.serviceType === 'FREE_SERVICE_2' ? '2' : '3';
    
    await this.whatsappService.sendServiceReminderTemplate(
      customer.contactNo,
      customer.name,
      reminder.salesInvoice.vehicleModel || 'CB350 H\'NESS',
      reminder.salesInvoice.vehicleRegNo || 'KA51JL5851',
      serviceNumber  // Just "1", "2", or "3"
    );
    
    await this.updateReminderLogStatus(reminder.id, 'SENT');
    this.logger.log(`Reminder sent successfully to ${customer.contactNo}`);
    
  } catch (error) {
    this.logger.error(`Failed to send reminder ${reminder.id}:`, error);
    await this.updateReminderLogStatus(reminder.id, 'FAILED', error.message);
  }
}

  async triggerRemindersManually() {
    await this.createReminders();
    await this.sendDueReminders();
    return { message: 'Reminders triggered successfully' };
  }
}