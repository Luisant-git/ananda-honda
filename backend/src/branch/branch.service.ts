import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.branch.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.branch.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.branch.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.branch.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
