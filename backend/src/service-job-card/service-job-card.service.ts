// service-job-card.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';

@Injectable()
export class ServiceJobCardService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.serviceJobCard.create({
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
  }

  // ✅ Upload Excel
  async uploadFile(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) {
      throw new BadRequestException('Excel file is empty');
    }

    let imported = 0;

    for (const row of rows) {
      const jobCardNumber = String(row['Job Card #'] || '').trim();
      if (!jobCardNumber) continue;

      const serviceName = String(
        row['JC Service Type'] || row['Service Type'] || ''
      ).trim();

      let serviceId: number | null = null;

      if (serviceName) {
        const service = await this.prisma.serviceType.upsert({
          where: { name: serviceName },
          update: {},
          create: {
            name: serviceName,
            status: 'Active',
          },
        });

        serviceId = service.id;
      }

      const fullName = [
        String(row['Customer First Name'] || '').trim(),
        String(row['Customer Last Name'] || '').trim(),
      ]
        .filter(Boolean)
        .join(' ');

      await this.prisma.serviceJobCard.upsert({
        where: { jobCardNumber },
        update: {
          registrationNumber: String(
            row['Vehicle Registration No.'] || ''
          ).trim(),
          customerName: fullName,
          mobileNumber: String(
            row['Contact Phone'] || row['Customer Contact Number'] || ''
          ).trim(),
          vehicleDetails: String(
            row['Model Name'] || row['Model Variant'] || ''
          ).trim(),
          serviceId,
          status:
            String(row['Job Card Status'] || '').trim() || 'Pending',
        },
        create: {
          jobCardNumber,
          registrationNumber: String(
            row['Vehicle Registration No.'] || ''
          ).trim(),
          customerName: fullName,
          mobileNumber: String(
            row['Contact Phone'] || row['Customer Contact Number'] || ''
          ).trim(),
          vehicleDetails: String(
            row['Model Name'] || row['Model Variant'] || ''
          ).trim(),
          serviceId,
          status:
            String(row['Job Card Status'] || '').trim() || 'Pending',
        },
      });

      imported++;
    }

    return { imported };
  }

  // ✅ Find All with optional include parameter
  async findAll(search?: string, includeServiceType?: boolean) {
    const where: Prisma.ServiceJobCardWhereInput = search
      ? {
          OR: [
            { jobCardNumber: { contains: search, mode: 'insensitive' as const } },
            { registrationNumber: { contains: search, mode: 'insensitive' as const } },
            { mobileNumber: { contains: search, mode: 'insensitive' as const } },
            { customerName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.serviceJobCard.findMany({
      where,
      include: includeServiceType ? { serviceType: true } : undefined,
      orderBy: { id: 'desc' },
    });
  }

  // ✅ Find by Mobile Number
  async findByMobileNumber(mobileNumber: string, includeServiceType?: boolean) {
    if (!mobileNumber) {
      throw new BadRequestException('Mobile number is required');
    }

    const records = await this.prisma.serviceJobCard.findMany({
      where: { 
        mobileNumber: mobileNumber 
      },
      include: includeServiceType ? { serviceType: true } : undefined,
      orderBy: { id: 'desc' },
    });

    return records;
  }

  // ✅ Search with include option
  async search(searchTerm: string, includeServiceType?: boolean) {
    if (!searchTerm) {
      return this.findAll(undefined, includeServiceType);
    }

    const where: Prisma.ServiceJobCardWhereInput = {
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

  // ✅ Update Status
  async updateStatus(id: number, status: string) {
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

      return this.prisma.serviceJobCard.update({
        where: { id: numericId },
        data: { status },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error updating status: ${error.message}`);
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
}