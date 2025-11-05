import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class MenuPermissionService {
  constructor(private prisma: PrismaService) {}

  async getByRole(role: Role) {
    const permission = await this.prisma.menuPermission.findUnique({
      where: { role }
    });
    return permission?.permissions || {};
  }

  async upsert(role: Role, permissions: any) {
    return this.prisma.menuPermission.upsert({
      where: { role },
      update: { permissions },
      create: { role, permissions }
    });
  }

  async getAll() {
    return this.prisma.menuPermission.findMany();
  }
}
