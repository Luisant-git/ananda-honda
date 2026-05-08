import { Module } from '@nestjs/common';
import { ServiceTypeService } from './service-type.service';
import { ServiceTypeController } from './service-type.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceTypeController],
  providers: [ServiceTypeService,PrismaService],
})
export class ServiceTypeModule {}
