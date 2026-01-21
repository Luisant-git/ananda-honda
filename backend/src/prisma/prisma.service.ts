import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static instance: PrismaService;

  constructor() {
    if (PrismaService.instance) return PrismaService.instance;
    super({ datasources: { db: { url: process.env.DATABASE_URL } } });
    PrismaService.instance = this;
  }

  async onModuleInit() {
    await this.$connect();
    process.on('SIGINT', async () => {
      await this.$disconnect();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await this.$disconnect();
      process.exit(0);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}