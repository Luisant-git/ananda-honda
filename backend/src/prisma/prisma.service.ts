import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { brandContext } from '../common/brand.context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    
    // Multi-tenant Row-Level Security Middleware
    this.$use(async (params, next) => {
      const brand = brandContext.getStore();
      
      if (brand) {
        const action = params.action;
        // Don't filter MenuPermission because it is a global configuration table (shared)
        const excludedModels = ['MenuPermission'];
        
        if (params.model && !excludedModels.includes(params.model)) {
          // INTERCEPT READ QUERIES
          if (['findUnique', 'findFirst', 'findMany', 'count', 'updateMany', 'deleteMany', 'aggregate', 'groupBy'].includes(action)) {
             params.args = params.args || {};
             
             if (action === 'findUnique') {
                params.action = 'findFirst';
             }
             
             params.args.where = { ...params.args.where, brand };
          }
          
          // PRE-CHECK FOR UPDATE & DELETE
          if (['update', 'delete'].includes(action)) {
             params.args = params.args || {};
             // We cannot inject 'brand' into where for update/delete because Prisma strictly requires unique identifiers only.
             // Instead, we verify ownership before executing.
             const existingRecord = await (this as any)[params.model].findFirst({
               where: params.args.where
             });
             
             if (existingRecord && existingRecord.brand !== brand) {
               throw new Error('Unauthorized: You do not have permission to modify this record.');
             }
          }
          
          // INTERCEPT CREATE QUERIES
          if (['create', 'createMany'].includes(action)) {
             params.args = params.args || {};
             if (action === 'create') {
               params.args.data = { ...params.args.data, brand };
             } else if (action === 'createMany' && Array.isArray(params.args.data)) {
               params.args.data = params.args.data.map((d: any) => ({ ...d, brand }));
             }
          }
        }
      }
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}