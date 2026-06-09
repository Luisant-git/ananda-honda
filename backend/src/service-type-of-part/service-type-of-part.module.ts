import { Module } from '@nestjs/common';
import { ServiceTypeOfPartService } from './service-type-of-part.service';
import { ServiceTypeOfPartController } from './service-type-of-part.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceTypeOfPartController],
  providers: [ServiceTypeOfPartService],
})
export class ServiceTypeOfPartModule {}
