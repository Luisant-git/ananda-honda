import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly cls: ClsService) {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    return new Proxy(this, {
      get: (target: any, prop: string) => {
        // Intercept Prisma model delegates (e.g., this.customer, this.serviceJobCard)
        // Ensure prop is a string (symbols like then, catch are ignored)
        if (typeof prop === 'string' && typeof target[prop] === 'object' && target[prop] !== null && 'findMany' in target[prop]) {
          const modelName = prop;
          
          // Skip global tables
          if (['menuPermission', 'branch'].includes(modelName)) {
            return target[prop];
          }

          return new Proxy(target[prop], {
            get: (modelTarget: any, action: string) => {
              if (typeof modelTarget[action] === 'function') {
                return async (args: any = {}) => {
                  const brand = this.cls.get('brand');
                  const branchCode = this.cls.get('branchCode');
                  
                  // Collect filters to apply based on what is available in the current context
                  const filters: any = {};
                  if (brand) filters.brand = brand;
                  
                  // Only apply branchCode filter to transactional tables that have this field
                  const branchCodeModels = [
                    'user', 'customer', 'paymentCollection', 'servicePaymentCollection',
                    'serviceJobCard', 'salesInvoice', 'paymentTransaction', 'enquiry', 'lead'
                  ];
                  
                  if (branchCode && branchCodeModels.includes(modelName)) {
                    filters.branchCode = branchCode;
                  }
                  
                  if (Object.keys(filters).length > 0) {
                    // Bypass RLS for findUnique on 'user' model so users from any brand/branch can log in!
                    const isUserLoginQuery = modelName === 'user' && action === 'findUnique';
                    
                    if (isUserLoginQuery) {
                       return modelTarget[action](args);
                    }

                    // INTERCEPT READ QUERIES
                    if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(action)) {
                      args.where = { ...args.where, ...filters };
                    }
                    
                    // HANDLE FIND UNIQUE (Prisma strict unique constraint workaround)
                    if (action === 'findUnique') {
                      return modelTarget['findFirst']({ ...args, where: { ...args.where, ...filters } });
                    }
                    
                    // PRE-CHECK FOR UPDATE & DELETE
                    if (['update', 'delete'].includes(action)) {
                      const existingRecord = await modelTarget['findFirst']({
                        where: args.where
                      });
                      
                      if (existingRecord) {
                        if (brand && existingRecord.brand !== brand) {
                           throw new Error('Unauthorized: You do not have permission to modify this record (Brand mismatch).');
                        }
                        if (branchCode && existingRecord.branchCode && existingRecord.branchCode !== branchCode) {
                           throw new Error('Unauthorized: You do not have permission to modify this record (Branch mismatch).');
                        }
                      }
                    }
                    
                    // INTERCEPT CREATE QUERIES
                    if (['create', 'createMany'].includes(action)) {
                      if (action === 'create') {
                        args.data = { ...args.data, ...filters };
                      } else if (action === 'createMany' && Array.isArray(args.data)) {
                        args.data = args.data.map((d: any) => ({ ...d, ...filters }));
                      }
                    }
                  }
                  
                  return modelTarget[action](args);
                };
              }
              return modelTarget[action];
            }
          });
        }
        
        // Return normal properties/methods (like $connect, $transaction, etc)
        const value = target[prop];
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}