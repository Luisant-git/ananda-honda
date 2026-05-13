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

    let serviceId: number | null = null; // Changed from undefined to null

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
    if (serviceId !== null) updateData.serviceId = serviceId; // Check for null instead of undefined
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
 // ✅ Update entire record
  
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