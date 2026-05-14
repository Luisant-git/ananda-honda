import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceTypeOfPartService {
  constructor(private prisma: PrismaService) {}

  async create(data: { partNo: string; partDescription: string; status?: string }) {
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
        partName: data.partDescription, // Map partDescription to partName in DB
        status: data.status || 'Enable'
      }
    });
  }

  async findAll() {
    const parts = await this.prisma.serviceTypeOfPart.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Transform partName to partDescription for response
    return parts.map(part => ({
      id: part.id,
      partNo: part.partNo,
      partDescription: part.partName,
      status: part.status,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt
    }));
  }

  async findOne(id: number) {
    const part = await this.prisma.serviceTypeOfPart.findUnique({
      where: { id }
    });

    if (!part) {
      throw new NotFoundException(`Service part with ID ${id} not found`);
    }

    return {
      id: part.id,
      partNo: part.partNo,
      partDescription: part.partName,
      status: part.status,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt
    };
  }

  async findByPartNo(partNo: string) {
    const part = await this.prisma.serviceTypeOfPart.findUnique({
      where: { partNo }
    });

    if (!part) {
      throw new NotFoundException(`Service part with number ${partNo} not found`);
    }

    return {
      id: part.id,
      partNo: part.partNo,
      partDescription: part.partName,
      status: part.status,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt
    };
  }

  async update(id: number, data: { partNo?: string; partDescription?: string; status?: string }) {
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

    const updateData: any = {};
    if (data.partNo) updateData.partNo = data.partNo;
    if (data.partDescription) updateData.partName = data.partDescription;
    if (data.status) updateData.status = data.status;

    const updatedPart = await this.prisma.serviceTypeOfPart.update({
      where: { id },
      data: updateData
    });

    return {
      id: updatedPart.id,
      partNo: updatedPart.partNo,
      partDescription: updatedPart.partName,
      status: updatedPart.status,
      createdAt: updatedPart.createdAt,
      updatedAt: updatedPart.updatedAt
    };
  }

  async remove(id: number) {
    // Check if part exists
    await this.findOne(id);

    return this.prisma.serviceTypeOfPart.delete({
      where: { id }
    });
  }

  async bulkCreate(parts: Array<{ partNo: string; partDescription: string; status?: string }>) {
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
            partName: part.partDescription,
            status: part.status || 'Enable'
          }
        });
        results.success.push({
          id: created.id,
          partNo: created.partNo,
          partDescription: created.partName,
          status: created.status
        });
      } catch (error) {
        results.failed.push({ ...part, error: error.message });
      }
    }

    return results;
  }

  async getEnabledParts() {
    const parts = await this.prisma.serviceTypeOfPart.findMany({
      where: { status: 'Enable' },
      orderBy: { partName: 'asc' }
    });
    
    return parts.map(part => ({
      id: part.id,
      partNo: part.partNo,
      partDescription: part.partName,
      status: part.status
    }));
  }

  async getPartsByStatus(status: string) {
    const parts = await this.prisma.serviceTypeOfPart.findMany({
      where: { status },
      orderBy: { partName: 'asc' }
    });
    
    return parts.map(part => ({
      id: part.id,
      partNo: part.partNo,
      partDescription: part.partName,
      status: part.status
    }));
  }
}