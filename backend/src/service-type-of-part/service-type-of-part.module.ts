import { Module } from '@nestjs/common';
import { ServiceTypeOfPartService } from './service-type-of-part.service';
import { ServiceTypeOfPartController } from './service-type-of-part.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceTypeOfPartController],
  providers: [ServiceTypeOfPartService, PrismaService],
})
export class ServiceTypeOfPartModule {}
