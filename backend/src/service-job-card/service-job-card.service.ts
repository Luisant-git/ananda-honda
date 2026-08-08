// service-job-card.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

@Injectable()
export class ServiceJobCardService {
  private readonly logger = new Logger(ServiceJobCardService.name);

  constructor(private prisma: PrismaService, private whatsappService: WhatsappService) {}

  // ✅ Create
  async create(dto: any) {
    const count = await this.prisma.serviceJobCard.count();

    const jobCardNumber =
      dto.jobCardNumber || `SJC${String(count + 1).padStart(5, '0')}`;

    let serviceId: number | null = null;

    if (dto.serviceType) {
      const service = await this.prisma.serviceType.findFirst({
        where: { name: dto.serviceType },
      });

      if (!service) {
        throw new BadRequestException(
          `ServiceType not found: ${dto.serviceType}`
        );
      }

      serviceId = service.id;
    }

    const created = await this.prisma.serviceJobCard.create({
      data: {
        jobCardNumber,
        registrationNumber: dto.registrationNumber,
        customerName: dto.customerName,
        mobileNumber: dto.mobileNumber,
        vehicleDetails: dto.vehicleDetails,
        serviceId,
        status: dto.status || 'Pending',
      },
    });

    // Send welcome message to customer WhatsApp number for newly created job card
    try {
      const mobile = (dto.mobileNumber || created.mobileNumber || '').toString().trim();
      if (mobile && mobile !== 'N/A') {
        const name = dto.customerName || created.customerName || 'Customer';
        const jobNum = jobCardNumber;

        // Send a template welcome message via WhatsApp
        try {
          const res = await this.whatsappService.sendServiceWelcomeTemplate(
            mobile,
            name,
            dto.serviceAdvisorPhone || process.env.SERVICE_ADVISOR_PHONE || '9108812221',
          );
          this.logger.log(`Welcome service template sent to ${mobile} for job card ${jobCardNumber}`);
          this.logger.debug(JSON.stringify(res));
        } catch (sendErr) {
          this.logger.error(`Failed to send welcome template to ${mobile}`, sendErr?.response || sendErr?.message || sendErr);
        }
      }
    } catch (err) {
      this.logger.error('Failed to send welcome WhatsApp message', err?.response || err?.message || err);
    }

    return created;
  }

  // ✅ Helper to parse Excel dates
  private parseExcelDate(val: any): Date | null {
    if (!val) return null;
    
    // If it's already a Date object
    if (val instanceof Date) return val;
    
    // If it's a number (Excel serial date)
    if (typeof val === 'number') {
      return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    
    // If it's a string
    const str = String(val).trim();
    if (!str) return null;
    
    // Try standard JS parsing
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    
    // Try DD-MM-YYYY or DD/MM/YYYY with optional time
    const [datePart, timePart] = str.split(' ');
    const parts = datePart.split(/[-/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
      
      let hours = 0, minutes = 0, seconds = 0;
      if (timePart) {
        const tParts = timePart.split(':');
        if (tParts.length >= 2) {
          hours = parseInt(tParts[0], 10) || 0;
          minutes = parseInt(tParts[1], 10) || 0;
          seconds = tParts.length >= 3 ? parseInt(tParts[2], 10) || 0 : 0;
        }
      }
      
      const nd = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(nd.getTime())) return nd;
    }

    return null;
  }

  // ✅ Multi-format Upload
    async uploadFile(buffer: Buffer, type: 'REVENUE' | 'WORKSHOP' | 'INVOICE' | 'ORDER' = 'REVENUE', fileName: string = 'unknown.xlsx') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const allRowsAoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(20, allRowsAoa.length); i++) {
      const rowArray = allRowsAoa[i] || [];
      const hasJobCardHeader = rowArray.some(cell => {
        const str = String(cell).toLowerCase().trim();
        return str === 'job card number' || str === 'job card #' || str === 'registration number' || str === 'jobcard no.' || str === 'job card';
      });
      if (hasJobCardHeader) {
        headerRowIdx = i;
        break;
      }
    }

    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', range: headerRowIdx });

    if (!rows.length) {
      throw new BadRequestException('Excel file is empty');
    }

    let imported = 0;
    const seenPartCategories = new Set<string>();
    
    // 1. First Pass: Map Data and collect unique Service Types
    const parsedRows: any[] = [];
    const uniqueServiceNames = new Set<string>();

    for (const row of rows) {
      let jobCardNumber = '';
      let registrationNumber = '';
      let customerName = '';
      let mobileNumber = '';
      let vehicleDetails = '';
      let serviceName = '';
      let closedDate: Date | null = null;
      let status = 'Pending';
      let labourRevenue = 0;
      let partsRevenue = 0;
      let lubesRevenue = 0;
      let accessoriesRevenue = 0;
      let totalRevenue = 0;
      let amc = false;
      let oil = false;
      let battery = false;
      let tyre = false;
      let painting = false;
      let currentKM = 0;
      let frameNumber = '';
      let invoiceNumber = '';
      let otpNo = '';
      let amcStartDate: Date | null = null;
      let amcEndDate: Date | null = null;
      let estimatedDeliveryDate: Date | null = null;
      let serviceAdvisorPhone = '';
      let branchCode = '';
      let mainCode = '';

      let jobCardDate: Date | null = null;

      if (type === 'REVENUE') {
        jobCardNumber = String(row['Job Card Number'] || '').trim();
        registrationNumber = String(row['Registration Number'] || '').trim();
        customerName = String(row['Customer Name'] || '').trim();
        serviceName = String(row['Service Type'] || '').trim();
        jobCardDate = this.parseExcelDate(row['Job Card Date'] || row['Date']);
        closedDate = this.parseExcelDate(row['Job Card Closed Date']);
        status = String(row['Job Card Status'] || '').trim();
        labourRevenue = parseFloat(row['Labour Revenue'] || '0');
        partsRevenue = parseFloat(row['Parts Revenue'] || '0');
        lubesRevenue = parseFloat(row['Lubes Revenue'] || '0');
        accessoriesRevenue = parseFloat(row['Accessories Revenue'] || '0');
        totalRevenue = parseFloat(row['Total Job Card Revenue'] || '0');
        amc = String(row['AMC Service'] || '').toLowerCase().includes('yes') || String(row['AMC Service'] || '') === '1';
        currentKM = parseFloat(row['Current KMs'] || '0');
        frameNumber = String(row['Frame Number'] || '').trim();
        vehicleDetails = String(row['Model Name'] || '').trim();
      } else if (type === 'WORKSHOP') {
        jobCardNumber = String(row['Job Card Number'] || row['Job Card #'] || '').trim();
        customerName = String(row['Customer Name'] || '').trim();
        mobileNumber = String(row['Customer Mobile'] || '').trim();
        jobCardDate = this.parseExcelDate(row['Job Card Date'] || row['Date']);
        serviceName = String(row['Service Type'] || '').trim();
        vehicleDetails = String(row['Model Name'] || row['Model Variant'] || '').trim();
        currentKM = parseFloat(row['Current KM'] || '0');
        frameNumber = String(row['Frame Number'] || '').trim();

        const partCategory = String(row['Part Category'] || '').toLowerCase().trim();
        const partDesc = String(row['Part Description'] || '').toLowerCase().trim();
        const combined = `${partCategory} ${partDesc}`.trim();

        if (partCategory) {
          seenPartCategories.add(partCategory);
          if ((partCategory.includes('oil') && !partCategory.includes('coil') && !partCategory.includes('foil')) || partCategory.includes('lub')) {
            oil = true;
          }
          if (partCategory.includes('amc')) { amc = true; }
          if (partCategory.includes('battery') || partCategory.includes('batteries')) { battery = true; }
          if (partCategory.includes('tyr') || partCategory.includes('tire')) { tyre = true; }
        }
        if (combined && (combined.includes('paint') || combined.includes('panel'))) {
          painting = true;
        }
      } else if (type === 'INVOICE') {
        const getVal = (key: string) => {
           const k = Object.keys(row).find(x => x.toLowerCase().trim() === key.toLowerCase().trim());
           return k ? row[k] : undefined;
        };
        jobCardNumber = String(getVal('Job Card #') || '').trim();
        jobCardDate = this.parseExcelDate(getVal('Job Card Date') || getVal('Date'));
        closedDate = this.parseExcelDate(getVal('Closed Date/ Time'));
        status = String(getVal('Job Card Status') || '').trim();
        registrationNumber = String(getVal('Vehicle Registration No.') || '').trim();
        customerName = `${String(getVal('Customer First Name') || '').trim()} ${String(getVal('Customer Last Name') || '').trim()}`.trim();
        mobileNumber = String(getVal('Contact Phone') || '').trim();
        serviceName = String(getVal('Service Type') || getVal('SR Type') || '').trim();
        vehicleDetails = String(getVal('Model Name') || getVal('Model Variant') || '').trim();
        frameNumber = String(getVal('Frame #') || '').trim();
        invoiceNumber = String(getVal('Invoice Number') || getVal('Invoice #') || getVal('Invoice No') || '').trim();
        
        let invAmt = getVal('Total Invoice Amount') || getVal('Invoice Amount') || 0;
        if (typeof invAmt === 'string') {
          const match = invAmt.match(/[d,]+.?d*/);
          invAmt = match ? match[0].replace(/,/g, '') : '0';
        }
        totalRevenue = parseFloat(String(invAmt) || '0');
      } else if (type === 'ORDER') {
        const getVal = (key: string) => {
           const k = Object.keys(row).find(x => x.toLowerCase().trim() === key.toLowerCase().trim());
           return k ? row[k] : undefined;
        };
        jobCardNumber = String(getVal('job card #') || getVal('job card') || getVal('job card number') || '').trim();
        registrationNumber = String(getVal('vehicle registration no.') || getVal('registration number') || '').trim();
        status = 'Pending';
        const firstName = String(getVal('customer first name') || '').trim();
        const account = String(getVal('account') || '').trim();
        customerName = firstName && account && firstName !== account ? `${firstName} ${account}` : (firstName || account);
        mobileNumber = String(getVal('contact phone') || getVal('account phone') || '').trim();
        serviceName = String(getVal('service type') || '').trim();
        vehicleDetails = String(getVal('model variant') || '').trim();
        jobCardDate = this.parseExcelDate(getVal('created date/time'));
        otpNo = String(getVal('otp no') || '').trim();
        amcStartDate = this.parseExcelDate(getVal('amc start date'));
        amcEndDate = this.parseExcelDate(getVal('amc end date'));
        estimatedDeliveryDate = this.parseExcelDate(getVal('effective final delivery estimate date'));
        serviceAdvisorPhone = String(getVal('service adviser phone') || getVal('service advisor phone') || getVal('service advicer phone') || getVal('advisor phone') || getVal('service advisor') || getVal('service_advisor_phone') || '').trim();
        branchCode = String(getVal('dealer code') || getVal('branch code') || '').trim();
        mainCode = String(getVal('main code') || '').trim();
      }

      if (!jobCardNumber) continue;

      if (jobCardDate && jobCardDate.getFullYear() === 2023) jobCardDate.setFullYear(2026);
      if (closedDate && closedDate.getFullYear() === 2023) closedDate.setFullYear(2026);

      if (serviceName) uniqueServiceNames.add(serviceName.trim());

      parsedRows.push({
        jobCardNumber, registrationNumber, customerName, mobileNumber, vehicleDetails,
        serviceName, closedDate, status, labourRevenue, partsRevenue, lubesRevenue,
        accessoriesRevenue, totalRevenue, amc, oil, battery, tyre, painting,
        currentKM, frameNumber, invoiceNumber, otpNo, amcStartDate, amcEndDate,
        estimatedDeliveryDate, serviceAdvisorPhone, branchCode, mainCode, jobCardDate,
        finalCreatedAt: jobCardDate || closedDate || new Date()
      });
    }

    // 2. Pre-fetch and create missing Service Types
    const existingServices = await this.prisma.serviceType.findMany();
    const serviceTypeMap = new Map<string, number>();
    existingServices.forEach(s => serviceTypeMap.set(s.name.toLowerCase().trim(), s.id));

    const newServicesData = Array.from(uniqueServiceNames)
        .filter(name => !serviceTypeMap.has(name.toLowerCase()))
        .map(name => ({ name, status: 'Active' }));

    if (newServicesData.length > 0) {
        await this.prisma.serviceType.createMany({ data: newServicesData, skipDuplicates: true });
        const updatedServices = await this.prisma.serviceType.findMany();
        updatedServices.forEach(s => serviceTypeMap.set(s.name.toLowerCase().trim(), s.id));
    }

    // 3. Process in Chunks
    const chunkSize = 200;
    const whatsappQueue: any[] = [];
    
    for (let i = 0; i < parsedRows.length; i += chunkSize) {
        const chunk = parsedRows.slice(i, i + chunkSize);
        const jobCardNumbers = chunk.map(r => r.jobCardNumber);
        
        // Fetch existing Job Cards
        const existingJobCards = await this.prisma.serviceJobCard.findMany({
            where: { jobCardNumber: { in: jobCardNumbers } },
            include: { serviceType: true }
        });
        const existingJobCardMap = new Map();
        existingJobCards.forEach(jc => existingJobCardMap.set(jc.jobCardNumber, jc));

        // Fetch Payments for INVOICE type
        const paymentsMap = new Map();
        if (type === 'INVOICE') {
            const allPayments = await this.prisma.servicePaymentCollection.findMany({
                where: { jobCardNumber: { in: jobCardNumbers }, deletedAt: null, cancelledAt: null }
            });
            allPayments.forEach(p => {
                if (!paymentsMap.has(p.jobCardNumber)) paymentsMap.set(p.jobCardNumber, []);
                paymentsMap.get(p.jobCardNumber).push(p);
            });
        }

        // Process chunk concurrently
        const promises = chunk.map(async (rowData) => {
            const serviceId = rowData.serviceName ? serviceTypeMap.get(rowData.serviceName.toLowerCase().trim()) : null;
            const existingJobCard = existingJobCardMap.get(rowData.jobCardNumber);
            
            if (existingJobCard) {
                const updateData: any = {
                    registrationNumber: rowData.registrationNumber || undefined,
                    customerName: rowData.customerName || undefined,
                    mobileNumber: rowData.mobileNumber || undefined,
                    vehicleDetails: rowData.vehicleDetails || undefined,
                    serviceId: serviceId || undefined,
                    labourRevenue: rowData.labourRevenue || undefined,
                    partsRevenue: rowData.partsRevenue || undefined,
                    lubesRevenue: rowData.lubesRevenue || undefined,
                    accessoriesRevenue: rowData.accessoriesRevenue || undefined,
                    currentKM: rowData.currentKM || undefined,
                    frameNumber: rowData.frameNumber || undefined,
                    invoiceNumber: rowData.invoiceNumber || undefined,
                    otpNo: rowData.otpNo || undefined,
                    amcStartDate: rowData.amcStartDate || undefined,
                    amcEndDate: rowData.amcEndDate || undefined,
                    estimatedDeliveryDate: rowData.estimatedDeliveryDate || undefined,
                    branchCode: rowData.branchCode || undefined,
                    mainCode: rowData.mainCode || undefined,
                    updatedAt: new Date(),
                };

                const isAlreadyClosed = existingJobCard.status.toLowerCase() === 'closed';
                if (!isAlreadyClosed) {
                    updateData.status = rowData.status || undefined;
                    updateData.closedDate = rowData.closedDate || undefined;
                }

                if (type === 'INVOICE') {
                    updateData.totalRevenue = rowData.totalRevenue;
                } else if (!existingJobCard.totalRevenue || existingJobCard.totalRevenue === 0) {
                    updateData.totalRevenue = rowData.totalRevenue || undefined;
                }

                if (rowData.amc) updateData.amc = true;
                if (rowData.oil) updateData.oil = true;
                if (rowData.battery) updateData.battery = true;
                if (rowData.tyre) updateData.tyre = true;
                if (rowData.painting) updateData.painting = true;

                const updatedJobCard = await this.prisma.serviceJobCard.update({
                    where: { jobCardNumber: rowData.jobCardNumber },
                    data: updateData,
                });

                if (type === 'INVOICE' && rowData.totalRevenue > 0) {
                    const currentTotalRevenue = rowData.totalRevenue;
                    const payments = paymentsMap.get(updatedJobCard.jobCardNumber) || [];
                    const paidAmount = payments.reduce((sum: number, p: any) => sum + p.recAmt, 0);
                    const hasFullPayment = payments.some((p: any) => (p.paymentType || '').toLowerCase().trim() === 'full payment' && p.recAmt > 0);

                    if ((paidAmount >= currentTotalRevenue || currentTotalRevenue - paidAmount <= 2.0) && hasFullPayment) {
                        let closedNow = false;
                        if (existingJobCard.status !== 'Closed') {
                            await this.prisma.serviceJobCard.update({
                                where: { jobCardNumber: updatedJobCard.jobCardNumber },
                                data: { status: 'Closed', closedDate: new Date() }
                            });
                            
                            await this.prisma.servicePaymentCollection.updateMany({
                                where: { jobCardNumber: updatedJobCard.jobCardNumber, deletedAt: null, cancelledAt: null, paymentStatus: 'pending' },
                                data: { paymentStatus: 'completed' }
                            });
                            closedNow = true;
                        }

                        if (closedNow && updatedJobCard.mobileNumber && updatedJobCard.mobileNumber !== 'N/A') {
                            whatsappQueue.push({
                                type: 'FEEDBACK',
                                mobile: updatedJobCard.mobileNumber,
                                custName: updatedJobCard.customerName || 'Customer',
                                vehicleModel: updatedJobCard.vehicleDetails || 'Honda 2-Wheeler',
                                registrationNo: updatedJobCard.registrationNumber || 'Your Vehicle',
                                jobCardNumber: updatedJobCard.jobCardNumber,
                                serviceName: existingJobCard.serviceType?.name
                            });
                        }
                    }
                }
            } else {
                const createdRecord = await this.prisma.serviceJobCard.create({
                    data: {
                        jobCardNumber: rowData.jobCardNumber,
                        registrationNumber: rowData.registrationNumber || 'N/A',
                        customerName: rowData.customerName || 'N/A',
                        mobileNumber: rowData.mobileNumber || 'N/A',
                        vehicleDetails: rowData.vehicleDetails || 'N/A',
                        serviceId,
                        status: rowData.status || 'Pending',
                        closedDate: rowData.closedDate,
                        labourRevenue: rowData.labourRevenue,
                        partsRevenue: rowData.partsRevenue,
                        lubesRevenue: rowData.lubesRevenue,
                        accessoriesRevenue: rowData.accessoriesRevenue,
                        totalRevenue: rowData.totalRevenue,
                        amc: rowData.amc,
                        oil: rowData.oil,
                        battery: rowData.battery,
                        tyre: rowData.tyre,
                        painting: rowData.painting,
                        currentKM: rowData.currentKM,
                        frameNumber: rowData.frameNumber,
                        invoiceNumber: rowData.invoiceNumber,
                        otpNo: rowData.otpNo,
                        amcStartDate: rowData.amcStartDate,
                        amcEndDate: rowData.amcEndDate,
                        estimatedDeliveryDate: rowData.estimatedDeliveryDate,
                        branchCode: rowData.branchCode,
                        mainCode: rowData.mainCode,
                        createdAt: rowData.finalCreatedAt,
                    },
                });

                if (type === 'ORDER' && createdRecord.mobileNumber && createdRecord.mobileNumber !== 'N/A') {
                    whatsappQueue.push({
                        type: 'WELCOME',
                        mobile: createdRecord.mobileNumber,
                        custName: createdRecord.customerName || 'Customer',
                        jobCardNumber: createdRecord.jobCardNumber,
                        serviceAdvisorPhone: rowData.serviceAdvisorPhone || process.env.SERVICE_ADVISOR_PHONE || '9108812221'
                    });
                }
            }
            imported++;
        });

        await Promise.all(promises);
    }

    // 4. Process WhatsApp Messages Asynchronously
    this.processWhatsAppQueue(whatsappQueue).catch(err => {
        this.logger.error('Background WhatsApp Queue Error', err);
    });

    console.log('DEBUG UNIQUE PART CATEGORIES SEEN IN UPLOAD:', Array.from(seenPartCategories));

    return { message: `Successfully imported ${imported} records`, count: imported };
  }

  // Asynchronous Queue Processor for WhatsApp messages
  private async processWhatsAppQueue(queue: any[]) {
      for (const msg of queue) {
          try {
              if (msg.type === 'WELCOME') {
                  await this.whatsappService.sendServiceWelcomeTemplate(msg.mobile, msg.custName, msg.serviceAdvisorPhone);
                  this.logger.log(`Sent service welcome template to ${msg.mobile} for job ${msg.jobCardNumber}`);
              } else if (msg.type === 'FEEDBACK') {
                  await this.whatsappService.sendFeedbackRequestTemplate(msg.mobile, msg.custName, msg.vehicleModel, msg.registrationNo);
                  this.logger.log(`Sent feedback request to ${msg.mobile} for job ${msg.jobCardNumber} after INVOICE upload`);
              }
          } catch (err: any) {
              this.logger.error(`Failed to send WhatsApp ${msg.type} message to ${msg.mobile}`, err?.response || err?.message || err);
          }
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
      }
  }


  // ✅ Find All with optional include parameter and status filter
  async findAll(search?: string, includeServiceType?: boolean, status?: string) {
    const where: Prisma.ServiceJobCardWhereInput = {
      ...(status && { status }), // Filter by status if provided
      ...(search && {
        OR: [
          { jobCardNumber: { contains: search, mode: 'insensitive' as const } },
          { registrationNumber: { contains: search, mode: 'insensitive' as const } },
          { mobileNumber: { contains: search, mode: 'insensitive' as const } },
          { customerName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    return this.prisma.serviceJobCard.findMany({
      where,
      include: includeServiceType ? { serviceType: true } : undefined,
      orderBy: { id: 'desc' },
      take: 1000,
    });
  }

  // ✅ Find Active Job Cards (only Pending status) for dropdown
  async findActiveJobCards(search?: string) {
    return this.findAll(search, true, 'Pending');
  }

  // ✅ Find Active Job Cards by Mobile Number
  async findActiveJobCardsByMobileNumber(mobileNumber: string) {
    if (!mobileNumber) {
      throw new BadRequestException('Mobile number is required');
    }

    const records = await this.prisma.serviceJobCard.findMany({
      where: { 
        mobileNumber: mobileNumber,
        status: 'Pending'
      },
      include: { serviceType: true },
      orderBy: { id: 'desc' },
    });

    return records;
  }

  // ✅ Find by Mobile Number with optional status filter
  async findByMobileNumber(mobileNumber: string, includeServiceType?: boolean, status?: string) {
    if (!mobileNumber) {
      throw new BadRequestException('Mobile number is required');
    }

    const where: Prisma.ServiceJobCardWhereInput = {
      mobileNumber: mobileNumber,
      ...(status && { status }),
    };

    const records = await this.prisma.serviceJobCard.findMany({
      where,
      include: includeServiceType ? { serviceType: true } : undefined,
      orderBy: { id: 'desc' },
    });

    return records;
  }

  // ✅ Search with include option and status filter
  async search(searchTerm: string, includeServiceType?: boolean, status?: string) {
    if (!searchTerm) {
      return this.findAll(undefined, includeServiceType, status);
    }

    const where: Prisma.ServiceJobCardWhereInput = {
      ...(status && { status }),
      OR: [
        { jobCardNumber: { contains: searchTerm, mode: 'insensitive' as const } },
        { registrationNumber: { contains: searchTerm, mode: 'insensitive' as const } },
        { mobileNumber: { contains: searchTerm, mode: 'insensitive' as const } },
        { customerName: { contains: searchTerm, mode: 'insensitive' as const } },
      ],
    };

    return this.prisma.serviceJobCard.findMany({
      where,
      include: includeServiceType ? { serviceType: true } : undefined,
      orderBy: { id: 'desc' },
      take: 1000,
    });
  }

  // ✅ Find One
  async findOne(id: number) {
    try {
      const numericId = Number(id);
      
      if (isNaN(numericId)) {
        throw new BadRequestException('Invalid ID format');
      }

      const record = await this.prisma.serviceJobCard.findUnique({
        where: { 
          id: numericId 
        },
        include: { 
          serviceType: true 
        },
      });

      if (!record) {
        throw new NotFoundException(`Service job card with ID ${id} not found`);
      }

      return record;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error finding service job card: ${error.message}`);
    }
  }

  // ✅ Update Status (accepts object)
  async updateStatus(id: number, data: { status: string }) {
    try {
      const numericId = Number(id);
      
      if (isNaN(numericId)) {
        throw new BadRequestException('Invalid ID format');
      }

      if (!data.status) {
        throw new BadRequestException('Status is required');
      }

      const validStatuses = ['Pending', 'Closed'];
      if (!validStatuses.includes(data.status)) {
        throw new BadRequestException(`Status must be one of: ${validStatuses.join(', ')}`);
      }

      const existingRecord = await this.prisma.serviceJobCard.findUnique({
        where: { id: numericId },
      });

      if (!existingRecord) {
        throw new NotFoundException(`Service job card with ID ${id} not found`);
      }

      return this.prisma.serviceJobCard.update({
        where: { id: numericId },
        data: { status: data.status },
        include: { serviceType: true },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error updating status: ${error.message}`);
    }
  }

  // ✅ Update entire record
  async update(id: number, data: {
    jobCardNumber?: string;
    registrationNumber?: string;
    customerName?: string;
    mobileNumber?: string;
    vehicleDetails?: string;
    serviceType?: string;
    status?: string;
  }) {
    try {
      const numericId = Number(id);
      
      if (isNaN(numericId)) {
        throw new BadRequestException('Invalid ID format');
      }

      const existingRecord = await this.prisma.serviceJobCard.findUnique({
        where: { id: numericId },
      });

      if (!existingRecord) {
        throw new NotFoundException(`Service job card with ID ${id} not found`);
      }

      let serviceId: number | null = null;

      if (data.serviceType) {
        const service = await this.prisma.serviceType.findFirst({
          where: { name: data.serviceType },
        });

        if (!service) {
          throw new BadRequestException(`ServiceType not found: ${data.serviceType}`);
        }

        serviceId = service.id;
      }

      const updateData: any = {};
      if (data.jobCardNumber !== undefined) updateData.jobCardNumber = data.jobCardNumber;
      if (data.registrationNumber !== undefined) updateData.registrationNumber = data.registrationNumber;
      if (data.customerName !== undefined) updateData.customerName = data.customerName;
      if (data.mobileNumber !== undefined) updateData.mobileNumber = data.mobileNumber;
      if (data.vehicleDetails !== undefined) updateData.vehicleDetails = data.vehicleDetails;
      if (serviceId !== null) updateData.serviceId = serviceId;
      if (data.status !== undefined) updateData.status = data.status;

      return this.prisma.serviceJobCard.update({
        where: { id: numericId },
        data: updateData,
        include: { serviceType: true },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error updating service job card: ${error.message}`);
    }
  }
  
  // ✅ Delete
  async remove(id: number) {
    try {
      const numericId = Number(id);
      
      if (isNaN(numericId)) {
        throw new BadRequestException('Invalid ID format');
      }

      const existingRecord = await this.prisma.serviceJobCard.findUnique({
        where: { id: numericId },
      });

      if (!existingRecord) {
        throw new NotFoundException(`Service job card with ID ${id} not found`);
      }

      return this.prisma.serviceJobCard.delete({
        where: { id: numericId },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error deleting service job card: ${error.message}`);
    }
  }

  // ✅ Clear All
  async clearAll() {
    try {
      const result = await this.prisma.serviceJobCard.deleteMany({});
      return { 
        message: 'All service job cards cleared successfully',
        count: result.count 
      };
    } catch (error) {
      throw new BadRequestException(`Error clearing service job cards: ${error.message}`);
    }
  }

  // ✅ Get All Statuses (for dropdown)
  async getStatuses() {
    return ['Pending', 'Closed'];
  }
}