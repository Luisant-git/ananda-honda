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
        data.serviceNumber?.toString() || '1'
      );
      
      this.logger.log(`Test reminder sent to ${data.phoneNumber}`);
      return { success: true, message: 'Test reminder sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to send test reminder: ${error.message}`);
      throw error;
    }
  }

  async getAllReminders(filters?: {
    status?: string;
    serviceType?: string;
    fromDate?: Date;
    toDate?: Date;
    invoiceId?: number;
    limit?: number;
  }) {
    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    } else {
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
        salesInvoice: true
      },
      orderBy: { sentAt: 'desc' },
      take: filters?.limit
    });
    
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
      by: ['serviceType', 'reminderNumber', 'status'],
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

  async clearAll() {
    return this.prisma.serviceReminderLog.deleteMany({});
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
      
      // Free Service 1
      await this.createReminder(invoice.id, deliveryDate, 'FREE_SERVICE_1', 1, 10);  // Reminder 1 after 10 days
      await this.createReminder(invoice.id, deliveryDate, 'FREE_SERVICE_1', 2, 20);  // Reminder 2 after 20 days
      
      // Free Service 2
      await this.createReminder(invoice.id, deliveryDate, 'FREE_SERVICE_2', 1, 180); // Reminder 1 after 180 days
      await this.createReminder(invoice.id, deliveryDate, 'FREE_SERVICE_2', 2, 190); // Reminder 2 after 190 days
      
      // Free Service 3
      await this.createReminder(invoice.id, deliveryDate, 'FREE_SERVICE_3', 1, 350); // Reminder 1 after 350 days
      await this.createReminder(invoice.id, deliveryDate, 'FREE_SERVICE_3', 2, 360); // Reminder 2 after 360 days
    }
    
    this.logger.log('Reminder creation completed');
  }

  private async createReminder(
    invoiceId: number, 
    deliveryDate: Date, 
    serviceType: string, 
    reminderNumber: number, 
    daysAfter: number
  ) {
    const serviceDate = new Date(deliveryDate);
    serviceDate.setDate(serviceDate.getDate() + daysAfter);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only create if service date is today or in the future
    if (serviceDate >= today) {
      // Check if this specific reminder already exists
      const existingReminder = await this.prisma.serviceReminderLog.findFirst({
        where: { 
          salesInvoiceId: invoiceId, 
          serviceType: serviceType,
          reminderNumber: reminderNumber
        }
      });
      
      if (!existingReminder) {
        // Schedule reminder 5 days before service date
        const scheduledDate = new Date(serviceDate);
        scheduledDate.setDate(scheduledDate.getDate() - 5);
        
        // Only create if scheduled date is today or in the future
        if (scheduledDate >= today) {
          await this.prisma.serviceReminderLog.create({
            data: {
              salesInvoiceId: invoiceId,
              serviceType: serviceType,
              reminderNumber: reminderNumber,
              reminderDate: serviceDate,
              scheduledDate: scheduledDate,
              status: 'PENDING'
            }
          });
          this.logger.log(`Created ${serviceType} Reminder ${reminderNumber} for invoice ${invoiceId} (${daysAfter} days after delivery)`);
        }
      } else {
        this.logger.log(`${serviceType} Reminder ${reminderNumber} already exists for invoice ${invoiceId}`);
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
    
    this.logger.log(`Found ${dueReminders.length} due reminders to send`);
    
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
    
    this.logger.log(`Found ${failedReminders.length} failed reminders to retry`);
    
    for (const reminder of failedReminders) {
      await this.sendReminder(reminder);
    }
  }

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
      
      // Send the reminder number
      const serviceNumber = reminder.reminderNumber.toString();
      
      await this.whatsappService.sendServiceReminderTemplate(
        customer.contactNo,
        customer.name,
        reminder.salesInvoice.vehicleModel || 'CB350 H\'NESS',
        reminder.salesInvoice.vehicleRegNo || 'KA51JL5851',
        serviceNumber
      );
      
      await this.updateReminderLogStatus(reminder.id, 'SENT');
      this.logger.log(`Reminder sent successfully to ${customer.contactNo} - Service: ${reminder.serviceType}, Reminder Number: ${serviceNumber}`);
      
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