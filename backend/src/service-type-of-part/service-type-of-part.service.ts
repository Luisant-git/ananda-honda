import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type StatusType = 'ORDERED' | 'RECEIVED' | 'NOT_RECEIVED';

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: StatusType;
}

@Injectable()
export class ServiceTypeOfPartService {
  constructor(private prisma: PrismaService) {}

  // ✅ COMMON RESPONSE
  private formatResponse(data: any[], total: number, page: number, limit: number) {
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ✅ COMMON MAPPER
  private mapPart(part: any) {
    return {
      id: part.id,
      partNo: part.partNo,
      partDescription: part.partName,
      Model: part.Model || 'N/A',
      status: part.status,
      statusDate: part.statusDate,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt,
    };
  }

  // ✅ FIXED WHERE BUILDER
  private buildWhere(query: QueryParams): Prisma.ServiceTypeOfPartWhereInput {
    const { search, status } = query;

    const where: Prisma.ServiceTypeOfPartWhereInput = {};

    if (search) {
      where.OR = [
        { partNo: { contains: search, mode: 'insensitive' } },
        { partName: { contains: search, mode: 'insensitive' } },
        { Model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    return where;
  }

  // ✅ CREATE
  async create(data: {
    partNo: string;
    partDescription: string;
    Model?: string;
    status?: StatusType;
    statusDate?: string;
  }) {
    const existing = await this.prisma.serviceTypeOfPart.findUnique({
      where: { partNo: data.partNo },
    });

    if (existing) {
      throw new ConflictException(`Part number ${data.partNo} already exists`);
    }

    return this.prisma.serviceTypeOfPart.create({
      data: {
        partNo: data.partNo,
        partName: data.partDescription,
        Model: data.Model || null,
        status: data.status || 'ORDERED',
        statusDate: data.statusDate ? new Date(data.statusDate) : new Date(),
      },
    });
  }

  // ✅ FIND ALL (PAGINATION + FILTER)
  async findAll(query: QueryParams) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhere(query);

    const [total, parts] = await Promise.all([
      this.prisma.serviceTypeOfPart.count({ where }),
      this.prisma.serviceTypeOfPart.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return this.formatResponse(
      parts.map(p => this.mapPart(p)),
      total,
      page,
      limit,
    );
  }

  // ✅ FIND BY PART NO
  async findByPartNo(partNo: string) {
    const part = await this.prisma.serviceTypeOfPart.findUnique({
      where: { partNo },
    });

    if (!part) throw new NotFoundException('Part not found');

    return this.mapPart(part);
  }

  // ✅ FIND ONE
  async findOne(id: number | string) {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid ID format');
    }

    const part = await this.prisma.serviceTypeOfPart.findUnique({
      where: { id: numericId },
    });

    if (!part) throw new NotFoundException('Not found');

    return this.mapPart(part);
  }

  // ✅ UPDATE STATUS
  async updateStatus(id: number | string, body: { status: StatusType; statusDate: string }) {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid ID format');
    }

    await this.findOne(numericId);

    return this.prisma.serviceTypeOfPart.update({
      where: { id: numericId },
      data: {
        status: body.status,
        statusDate: new Date(body.statusDate),
      },
    });
  }

async update(id: number | string, data: any) {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  console.log('Service update received data:', JSON.stringify(data, null, 2)); // Debug log
  
  if (isNaN(numericId)) {
    throw new NotFoundException('Invalid ID format');
  }

  await this.findOne(numericId);

  if (data.partNo) {
    const existing = await this.prisma.serviceTypeOfPart.findUnique({
      where: { partNo: data.partNo },
    });

    if (existing && existing.id !== numericId) {
      throw new ConflictException('Duplicate partNo');
    }
  }

  // Build update data dynamically including status
  const updateData: any = {
    partNo: data.partNo,
    partName: data.partDescription,
  };
  
  // Only include Model if it's provided
  if (data.Model !== undefined) {
    updateData.Model = data.Model || null;
  }
  
  // ✅ IMPORTANT: Include status if provided
  if (data.status) {
    updateData.status = data.status;
    console.log('Updating status to:', data.status); // Debug log
  }
  
  // Include statusDate if provided
  if (data.statusDate) {
    updateData.statusDate = new Date(data.statusDate);
  }

  console.log('Final update data:', updateData); // Debug log

  const updated = await this.prisma.serviceTypeOfPart.update({
    where: { id: numericId },
    data: updateData,
  });
  
  return this.mapPart(updated);
}

  async remove(id: number | string) {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid ID format');
    }

    await this.findOne(numericId);
    return this.prisma.serviceTypeOfPart.delete({ where: { id: numericId } });
  }

  // ✅ BULK CREATE
  async bulkCreate(parts: {
    partNo: string;
    partDescription: string;
    Model?: string;
    status?: StatusType;
  }[]) {
    const results: {
      success: any[];
      failed: any[];
      duplicate: any[];
    } = {
      success: [],
      failed: [],
      duplicate: [],
    };

    for (const part of parts) {
      try {
        const exists = await this.prisma.serviceTypeOfPart.findUnique({
          where: { partNo: part.partNo },
        });

        if (exists) {
          results.duplicate.push(part);
          continue;
        }

        const created = await this.prisma.serviceTypeOfPart.create({
          data: {
            partNo: part.partNo,
            partName: part.partDescription,
            Model: part.Model || null,
            status: part.status || 'ORDERED',
            statusDate: new Date(),
          },
        });

        results.success.push(created);
      } catch (err) {
        results.failed.push({ ...part, error: err.message });
      }
    }

    return results;
  }
}