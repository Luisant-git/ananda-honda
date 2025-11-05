import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(data: { username: string; password: string; role: 'SUPER_ADMIN' | 'USER' | 'ENQUIRY' }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });
  }

  async login(data: { username: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { username: data.username }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Your account has been deactivated. Please contact super admin');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role
    };
  }

  async validateUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true }
    });
  }

  async changePassword(userId: number, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }
}