import { Module } from '@nestjs/common';
import { ServiceTypeOfCollectionService } from './service-type-of-collection.service';
import { ServiceTypeOfCollectionController } from './service-type-of-collection.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
  controllers: [ServiceTypeOfCollectionController],
  providers: [ServiceTypeOfCollectionService],
})
export class ServiceTypeOfCollectionModule {}
