import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        brand: true,
        branchId: true,
        branchCode: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { id: 'asc' }
    });
  }

  async create(data: { username: string; password: string; role: any; brand?: string; branchId?: number; branchCode?: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role,
        brand: data.brand || 'BIGWINGS',
        branchId: data.branchId || null,
        branchCode: data.branchCode || null
      },
      select: {
        id: true,
        username: true,
        role: true,
        brand: true,
        branchId: true,
        branchCode: true,
        isActive: true,
        createdAt: true
      }
    });
  }

  async update(id: number, data: { username?: string; password?: string; role?: any; brand?: string; branchId?: number; branchCode?: string }) {
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        brand: true,
        branchId: true,
        branchCode: true,
        isActive: true,
        createdAt: true
      }
    });
  }

  async toggleActive(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        username: true,
        role: true,
        brand: true,
        isActive: true,
        createdAt: true
      }
    });
  }
}
