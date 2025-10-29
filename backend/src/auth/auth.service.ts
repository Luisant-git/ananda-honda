import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(data: { username: string; password: string; role: 'SUPER_ADMIN' | 'USER' }) {
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
}