import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceTypeOfPartService {
  constructor(private prisma: PrismaService) {}

  async create(data: { partNo: string; partName: string; status?: string }) {
    // Check if part number already exists
    const existingPart = await this.prisma.serviceTypeOfPart.findUnique({
      where: { partNo: data.partNo }
    });

    if (existingPart) {
      throw new ConflictException(`Part number ${data.partNo} already exists`);
    }

    return this.prisma.serviceTypeOfPart.create({
      data: {
        partNo: data.partNo,
        partName: data.partName,
        status: data.status || 'Enable'
      }
    });
  }

  async findAll() {
    return this.prisma.serviceTypeOfPart.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    const part = await this.prisma.serviceTypeOfPart.findUnique({
      where: { id }
    });

    if (!part) {
      throw new NotFoundException(`Service part with ID ${id} not found`);
    }

    return part;
  }

  async findByPartNo(partNo: string) {
    const part = await this.prisma.serviceTypeOfPart.findUnique({
      where: { partNo }
    });

    if (!part) {
      throw new NotFoundException(`Service part with number ${partNo} not found`);
    }

    return part;
  }

  async update(id: number, data: { partNo?: string; partName?: string; status?: string }) {
    // Check if part exists
    await this.findOne(id);

    // If part number is being changed, check for duplicates
    if (data.partNo) {
      const existingPart = await this.prisma.serviceTypeOfPart.findUnique({
        where: { partNo: data.partNo }
      });

      if (existingPart && existingPart.id !== id) {
        throw new ConflictException(`Part number ${data.partNo} already exists`);
      }
    }

    return this.prisma.serviceTypeOfPart.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    // Check if part exists
    await this.findOne(id);

    return this.prisma.serviceTypeOfPart.delete({
      where: { id }
    });
  }

  async bulkCreate(parts: Array<{ partNo: string; partName: string; status?: string }>) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      duplicate: [] as any[]
    };

    for (const part of parts) {
      try {
        // Check for duplicate
        const existing = await this.prisma.serviceTypeOfPart.findUnique({
          where: { partNo: part.partNo }
        });

        if (existing) {
          results.duplicate.push(part);
          continue;
        }

        const created = await this.prisma.serviceTypeOfPart.create({
          data: {
            partNo: part.partNo,
            partName: part.partName,
            status: part.status || 'Enable'
          }
        });
        results.success.push(created);
      } catch (error) {
        results.failed.push({ ...part, error: error.message });
      }
    }

    return results;
  }

  async getEnabledParts() {
    return this.prisma.serviceTypeOfPart.findMany({
      where: { status: 'Enable' },
      orderBy: { partName: 'asc' }
    });
  }

  async getPartsByStatus(status: string) {
    return this.prisma.serviceTypeOfPart.findMany({
      where: { status },
      orderBy: { partName: 'asc' }
    });
  }
}