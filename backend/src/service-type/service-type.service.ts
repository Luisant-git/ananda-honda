import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceTypeService {
  constructor(private prisma: PrismaService) {}

  // GET ALL + SEARCH
  async getAll(search?: string) {
    return this.prisma.serviceType.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  // CREATE
  async create(data: { name: string; status?: string }) {
    const exists = await this.prisma.serviceType.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
      },
    });

    if (exists) {
      throw new BadRequestException('Service type already exists');
    }

    return this.prisma.serviceType.create({
      data: {
        name: data.name,
        status: data.status || 'ACTIVE',
      },
    });
  }

  // UPDATE
  async update(id: number, data: { name?: string; status?: string }) {
    return this.prisma.serviceType.update({
      where: { id },
      data,
    });
  }

  // DELETE
  async delete(id: number) {
    return this.prisma.serviceType.delete({
      where: { id },
    });
  }

  // CLEAR ALL
  async clearAll() {
    return this.prisma.serviceType.deleteMany();
  }

  // GET ONE
  async findOne(id: number) {
    return this.prisma.serviceType.findUnique({
      where: { id },
    });
  }
}